/**
 * Seed Test Users
 *
 * Creates test users in auth.users for development
 * Run with: node supabase/seed-users.js
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env file
const envPath = join(__dirname, '../.env')
const envContent = readFileSync(envPath, 'utf-8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const serviceRoleKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Test users to create
const testUsers = [
  {
    email: 'owner@test.com',
    password: 'Test1234!',
    user_metadata: {
      full_name: 'John Owner',
      role: 'owner'
    }
  },
  {
    email: 'delegate@test.com',
    password: 'Test1234!',
    user_metadata: {
      full_name: 'Sarah Delegate',
      role: 'delegate'
    }
  },
  {
    email: 'imam@test.com',
    password: 'Test1234!',
    user_metadata: {
      full_name: 'Muhammad Ali',
      role: 'imam'
    }
  },
  {
    email: 'member1@test.com',
    password: 'Test1234!',
    user_metadata: {
      full_name: 'Ahmed Hassan',
      role: 'member'
    }
  },
  {
    email: 'member2@test.com',
    password: 'Test1234!',
    user_metadata: {
      full_name: 'Fatima Rahman',
      role: 'member'
    }
  },
  {
    email: 'member3@test.com',
    password: 'Test1234!',
    user_metadata: {
      full_name: 'Omar Ibrahim',
      role: 'member'
    }
  },
  {
    email: 'volunteer@test.com',
    password: 'Test1234!',
    user_metadata: {
      full_name: 'Aisha Malik',
      role: 'volunteer'
    }
  }
]

async function seedUsers() {
  console.log('🌱 Seeding test users...\n')

  let created = 0
  let skipped = 0
  let errors = 0

  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const exists = existingUsers?.users.some(u => u.email === userData.email)

      if (exists) {
        console.log(`⏭️  Skipped: ${userData.email} (already exists)`)
        skipped++
        continue
      }

      // Create user
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: userData.user_metadata
      })

      if (error) {
        console.error(`❌ Error creating ${userData.email}:`, error.message)
        errors++
      } else {
        console.log(`✅ Created: ${userData.email} (${userData.user_metadata.full_name})`)
        created++
      }
    } catch (err) {
      console.error(`❌ Exception creating ${userData.email}:`, err.message)
      errors++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Created: ${created}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log(`   📝 Total: ${testUsers.length}`)

  // List all users
  console.log('\n👥 All users in database:')
  const { data: allUsers } = await supabase.auth.admin.listUsers()
  allUsers?.users.forEach(user => {
    console.log(`   - ${user.email} (${user.user_metadata?.full_name || 'No name'})`)
  })

  console.log('\n✨ Done!')
  console.log('\n🔑 All test users have password: Test1234!')
}

seedUsers().catch(console.error)
