import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/call/form/$type')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/call/form/$type"!</div>
}
