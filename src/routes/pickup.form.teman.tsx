import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pickup/form/teman')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/pickup/form/teman"!</div>
}
