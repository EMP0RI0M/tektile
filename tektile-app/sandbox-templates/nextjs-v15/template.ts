import { Template, waitForPort } from 'e2b'

export const template = Template()
  .fromNodeImage('22-slim')
  .aptInstall('curl', 'git')
  .setWorkdir('/home/user/app')
  .runCmd(
    'npx create-next-app@15.0.3 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-git --yes',
  )
  .runCmd('npm install framer-motion lucide-react @supabase/supabase-js')
  .setStartCmd('npm run dev', waitForPort(3000))
