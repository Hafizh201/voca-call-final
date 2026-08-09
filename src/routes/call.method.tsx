import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/call/method')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/call/method"!</div>
}
