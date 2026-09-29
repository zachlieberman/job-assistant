import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'
import { clearApiCache } from '../hooks/useApiResource'

// Page data is cached between visits; start every test cold.
beforeEach(() => clearApiCache())

// jsdom does not implement scrolling.
window.scrollTo = () => {}
