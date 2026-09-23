import { expect, test } from '@playwright/test'
import { CPR_QUIZ_QUESTIONS } from '../../src/lib/cpr-quiz'
const quizPass = { currentStep: 3, showQuizResults: true, selectedAnswers: CPR_QUIZ_QUESTIONS.map(question => question.correct) }

test('all routes work at desktop and phone widths without overflow', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  for (const width of [1440, 390]) {
    await page.setViewportSize({width, height: 900})
    for (const route of ['/', '/modules', '/cpr', '/heimlich', '/gun-violence', '/domestic-violence', '/achievements']) {
      await page.goto(route)
      await expect(page.locator('h1').first()).toBeVisible()
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), {message: `${route} overflows at ${width}px`}).toBe(true)
    }
  }
  expect(errors).toEqual([])
})

test('CPR quiz cannot be skipped and retains a first-option answer when navigating back', async ({page}) => {
  await page.goto('/cpr')
  await page.getByRole('button', {name: 'Continue →', exact: true}).click()
  await page.getByRole('button', {name: 'Continue →', exact: true}).click()
  await expect(page.getByRole('button', {name: 'Continue →', exact: true})).toBeDisabled()
  for (const question of CPR_QUIZ_QUESTIONS.slice(0, 3)) {
    await page.getByRole('button', {name: question.options[question.correct], exact: false}).click()
    await page.getByRole('button', {name: 'Submit Answer', exact: true}).click()
    await page.getByRole('button', {name: 'Next Question', exact: true}).click()
  }
  await page.getByRole('button', {name: 'Previous', exact: true}).click()
  await expect(page.getByRole('button', {name: CPR_QUIZ_QUESTIONS[2].options[0], exact: false})).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.getByRole('button', {name: CPR_QUIZ_QUESTIONS[2].options[0], exact: false})).toHaveAttribute('aria-pressed', 'true')
})

test('corrupt CPR storage recovers without crashing', async ({page}) => {
  await page.addInitScript(() => localStorage.setItem('cpr-training-progress', '{broken'))
  await page.goto('/cpr')
  await expect(page.getByRole('heading', {name:'CPR Video Tutorial'})).toBeVisible()
})

test('CPR rhythm round rejects fast input, retries and completes at a steady rate', async ({page}) => {
  test.setTimeout(120000)
  await page.addInitScript(progress => { localStorage.setItem('cpr-training-progress', JSON.stringify(progress)) }, quizPass)
  await page.goto('/cpr')
  await page.bringToFront()
  await page.getByRole('button', {name: 'Review the scene', exact: true}).click()
  await expect(page.getByRole('button', {name: 'Continue to hand placement →'})).toBeEnabled({timeout: 10000})
  await page.getByRole('button', {name: 'Continue to hand placement →'}).click()
  await page.getByRole('button', {name:'Place hands', exact: false}).click()
  const tap = page.getByRole('button', {name: 'Tap to compress', exact: false})
  for (let count = 0; count < 30; count++) await tap.click()
  await expect(page.getByRole('button', {name: 'Retry rhythm round'})).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cpr-training-progress')!).moduleCompleted)).toBe(false)
  await page.getByRole('button', {name:'Retry rhythm round'}).click()
  await page.getByRole('button', {name:'Full Screen', exact: true}).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  // Anchor browser click scheduling to a 110 BPM clock. This exercises real event handlers.
  const started = Date.now()
  for (let count = 0; count < 30; count++) {
    const remaining = started + count * (60000 / 110) - Date.now()
    if (remaining > 0) await page.waitForTimeout(remaining)
    await tap.click({force: true})
  }
  await expect(page.getByRole('link', {name: 'Complete Module →'})).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('cpr-training-progress')!).moduleCompleted)).toBe(true)
  await page.screenshot({path:'test-results/cpr-practice-desktop.png', fullPage:true})
  await page.setViewportSize({width:390,height:844})
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  await page.screenshot({path:'test-results/cpr-practice-mobile.png',fullPage:true})
  // The init script simulates a fresh saved quiz on every navigation; remove it by
  // checking the completion serializer in unit tests instead of overwriting on reload.
})

test('assistant offline state is explicit and does not block study', async ({page}) => {
  await page.route('**/api/chat', route => route.fulfill({status:503,body:'unavailable'}))
  await page.goto('/cpr')
  await page.getByRole('textbox', {name:'Ask the training assistant'}).fill('Help me review')
  await page.getByRole('button', {name:'Send',exact:true}).click()
  await expect(page.getByText('Study guidance · AI offline')).toBeVisible()
  await expect(page.getByRole('button',{name:'Try your question again'})).toBeVisible()
  await page.getByRole('button',{name:'Continue →',exact:true}).click()
  await expect(page.getByRole('heading',{name:'CPR Knowledge Studio'})).toBeVisible()
})

import { heimlichModule, gunViolenceModule, domesticViolenceModule } from '../../src/data/trainingModules'
import { getPracticeDefinition } from '../../src/data/practice'
for (const data of [heimlichModule, gunViolenceModule, domesticViolenceModule]) {
  test(`${data.slug}: lessons, 3D actions, both scenarios and saved completion`, async ({page}) => {
    test.setTimeout(120000)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(`/${data.slug}`)
    await page.getByRole('button', {name:'Start learning'}).click()
    await page.getByRole('button', {name:'Continue to quiz'}).click()
    for (const [index, question] of data.quiz.entries()) {
      await page.getByRole('button', {name: question.options[question.correct], exact:false}).click()
      await page.getByRole('button', {name:'Check answer', exact:false}).click()
      await page.getByRole('button', {name: index === data.quiz.length - 1 ? 'See results' : 'Next question', exact:false}).click()
    }
    await expect(page.getByText('100', {exact: false}).first()).toBeVisible()
    await page.getByRole('button', {name:'Go to practice', exact:false}).click()
    const definition = getPracticeDefinition(data.slug)
    await expect(page.getByTestId(`${data.slug}-3d-scene`).locator('canvas')).toBeVisible()
    await page.screenshot({path:`test-results/${data.slug}-3d-desktop.png`,fullPage:true})
    for (const [index, step] of definition.steps.entries()) {
      const group = page.getByRole('group', {name:'Practice actions',exact:true})
      if (index === 0) {
        const wrong = step.targets.find(target => !target.correct)
        if (wrong) {
          await group.getByRole('button', {name:wrong.label,exact:true}).click()
          await expect(page.getByText('Pause and reconsider')).toBeVisible()
          await expect(page.getByRole('button', {name:'Next practice step',exact:false})).toBeDisabled()
        }
        await page.getByRole('button', {name:'Expand practice',exact:true}).click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(page.getByRole('dialog')).toHaveCount(0)
      }
      const correct = step.targets.find(target => target.correct)!
      for (let count = 0; count < (step.repetitions ?? 1); count++) await group.getByRole('button', {name:correct.label,exact:true}).click()
      await page.getByRole('button', {name: index === definition.steps.length - 1 ? 'Finish 3D practice' : 'Next practice step',exact:false}).click()
    }
    await expect(page.getByRole('heading', {name:'3D practice completed'})).toBeVisible()
    await page.getByRole('button', {name:'Go to decision scenarios',exact:false}).click()
    await expect(page.getByRole('button', {name:'Complete module',exact:true})).toBeDisabled()
    for (const [scenarioIndex, scenario] of data.scenarios.entries()) {
      await page.getByRole('button', {name:scenario.title, exact:false}).click()
      let node = scenario.decisions[0]
      if (scenarioIndex === 0) {
        const wrong = node.choices.find(choice => !choice.correct)!
        await page.getByRole('button', {name: wrong.label, exact:false}).click()
        await expect(page.getByText('Pause and reconsider')).toBeVisible()
        await page.getByRole('button', {name:'Try another response'}).click()
      }
      while (node) {
        const choice = node.choices.find(choice => choice.correct)!
        await page.getByRole('button', {name:choice.label, exact:false}).click()
        await page.getByRole('button', {name:choice.next ? 'Continue scenario' : 'Finish scenario', exact:false}).click()
        if (!choice.next) break
        node = scenario.decisions.find(decision => decision.id === choice.next)!
      }
      await page.getByRole('button', {name:'Back to scenarios',exact:false}).click()
    }
    await page.getByRole('button', {name:'Complete module',exact:true}).click()
    await expect(page.getByRole('heading', {name:'Module completed'})).toBeVisible()
    await page.reload()
    await page.getByRole('button', {name:'Decision scenarios',exact:true}).click()
    await expect(page.getByRole('heading', {name:'Module completed'})).toBeVisible()
    await page.setViewportSize({width:390,height:844})
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
    await page.screenshot({path:`test-results/${data.slug}-mobile.png`,fullPage:true})
    await page.getByRole('link', {name:'Explore more modules'}).click()
    await expect(page.getByRole('link', {name: /^Review module:/})).toBeVisible()
    expect(errors).toEqual([])
  })
}
