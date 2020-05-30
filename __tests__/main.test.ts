import * as process from 'process'
import {execFileSync, ExecFileSyncOptions} from 'child_process'
import * as path from 'path'

const defaultEnv = {
  ...process.env,
  INPUT_ELM_REVIEW: 'npx elm-review'
}

const elmPath = (...file: string[]): string => {
  return path.join('__tests__', 'elm', ...file)
}

const runAction = (options: ExecFileSyncOptions): Buffer => {
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  return execFileSync('node', [ip], options)
}

beforeAll(() => {
  execFileSync('npx', ['tsc'])
})

test('runs quietly on success', () => {
  const env = {
    ...defaultEnv,
    INPUT_ELM_FILES: path.join('src', 'Good.elm')
  }

  let stdout = ''
  let status = 0
  try {
    const output = runAction({
      cwd: path.join(__dirname, 'elm'),
      env
    })
    stdout = output.toString()
  } catch (e) {
    stdout = e.stdout.toString()
    status = e.status
  }
  expect(stdout).toBe('')
  expect(status).toBe(0) // Success!
})

test('configures elm-review path', () => {
  const env = {
    ...defaultEnv,
    INPUT_ELM_REVIEW: path.join(__dirname, 'bin', 'elm-review-args')
  }

  let stdout = ''
  try {
    runAction({env})
  } catch (e) {
    stdout = e.stdout.toString()
  }
  expect(stdout).toBe('::error::elm-review --report=json\n')
})

test('configures review configuration', () => {
  const env = {
    ...defaultEnv,
    INPUT_ELM_REVIEW: path.join(__dirname, 'bin', 'elm-review-args'),
    INPUT_ELM_REVIEW_CONFIG: '/path/to/review'
  }

  let stdout = ''
  try {
    runAction({env})
  } catch (e) {
    stdout = e.stdout.toString()
  }
  expect(stdout).toBe(
    '::error::elm-review --report=json --config /path/to/review\n'
  )
})

test('configures elm compiler path', () => {
  const env = {
    ...defaultEnv,
    INPUT_ELM_REVIEW: path.join(__dirname, 'bin', 'elm-review-args'),
    INPUT_ELM_COMPILER: '/path/to/elm'
  }

  let stdout = ''
  try {
    runAction({env})
  } catch (e) {
    stdout = e.stdout.toString()
  }
  expect(stdout).toBe(
    '::error::elm-review --report=json --compiler /path/to/elm\n'
  )
})

test('configures elm-format path', () => {
  const env = {
    ...defaultEnv,
    INPUT_ELM_REVIEW: path.join(__dirname, 'bin', 'elm-review-args'),
    INPUT_ELM_FORMAT: '/path/to/elm-format'
  }

  let stdout = ''
  try {
    runAction({env})
  } catch (e) {
    stdout = e.stdout.toString()
  }
  expect(stdout).toBe(
    '::error::elm-review --report=json --elm-format-path /path/to/elm-format\n'
  )
})

test('configures elm.json path', () => {
  const env = {
    ...defaultEnv,
    INPUT_ELM_REVIEW: path.join(__dirname, 'bin', 'elm-review-args'),
    INPUT_ELM_JSON: '/path/to/elm.json'
  }

  let stdout = ''
  try {
    runAction({env})
  } catch (e) {
    stdout = e.stdout.toString()
  }
  expect(stdout).toBe(
    '::error::elm-review --report=json --elmjson /path/to/elm.json\n'
  )
})

test('reports errors', () => {
  const env = {
    ...defaultEnv,
    INPUT_ELM_JSON: elmPath('elm.json'),
    INPUT_ELM_FILES: elmPath('src', 'Bad.elm')
  }

  let stdout = ''
  let status = 0
  try {
    runAction({env})
  } catch (e) {
    stdout = e.stdout.toString()
    status = e.status
  }
  expect(stdout).toBe(
    '::error file=__tests__/elm/src/Bad.elm,line=3,col=22::Prefer listing what you wish to import and/or using qualified imports\n' +
      '::error file=__tests__/elm/src/Bad.elm,line=1,col=21::Module exposes everything implicitly "(..)"\n' +
      '::error::elm-review reported 2 errors\n'
  )
  expect(status).toBe(1)
})

test('handles cli errors', () => {
  const env = {
    ...defaultEnv
  }

  let stdout = ''
  let status = 0
  try {
    runAction({env})
  } catch (e) {
    stdout = e.stdout.toString()
    status = e.status
  }
  expect(stdout).toBe(
    '::error file=elm.json::I was expecting to find an elm.json file in the current directory or one of its parents, but I did not find one.%250A%0AIf you wish to run elm-review from outside your project,%0Atry re-running it with --elmjson <path-to-elm.json>.\n'
  )
  expect(status).toBe(1)
})
