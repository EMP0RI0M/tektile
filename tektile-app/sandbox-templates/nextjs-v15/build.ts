import { template } from './template'

async function main() {
  console.log('Building Next.js 15 + Tailwind v4 template...')
  const builtTemplate = await template.build()
  console.log('Template built successfully!')
  console.log('Template ID:', builtTemplate.id)
}

main().catch(console.error)
