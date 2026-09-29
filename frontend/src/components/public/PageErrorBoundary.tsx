import { Component, ErrorInfo, ReactNode } from 'react'
import ErrorState from './ErrorState'

interface Props {
  children: ReactNode
}

interface State {
  failed: boolean
}

/** Catches render errors (e.g. malformed API data) so visitors never see a blank page. */
export default class PageErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page failed to render', error, info.componentStack)
  }

  render() {
    if (this.state.failed) {
      return <ErrorState what="this page" onRetry={() => this.setState({ failed: false })} />
    }
    return this.props.children
  }
}
