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

// Generate test users with various roles
const firstNames = [
  'Ahmed', 'Muhammad', 'Omar', 'Ali', 'Hassan',
  'Fatima', 'Aisha', 'Khadija', 'Zainab', 'Maryam',
  'Ibrahim', 'Yusuf', 'Ismail', 'Khalid', 'Bilal',
  'Sumaya', 'Hafsa', 'Ruqayyah', 'Sarah', 'Leila',
  'Abdullah', 'Umar', 'Uthman', 'Hamza', 'Zayd',
  'Amina', 'Safiya', 'Nusaybah', 'Asma', 'Umm Salama'
]

const lastNames = [
  'Hassan', 'Ali', 'Khan', 'Rahman', 'Ibrahim',
  'Malik', 'Ahmed', 'Hussain', 'Sheikh', 'Abbas',
  'Syed', 'Farooq', 'Rashid', 'Iqbal', 'Mahmood',
  'Yousuf', 'Karim', 'Noor', 'Hasan', 'Javed'
]

// Generate 35 test users
const testUsers = []
const roles = [
  { role: 'owner', count: 2 },      // 2 owners
  { role: 'delegate', count: 3 },   // 3 delegates
  { role: 'imam', count: 2 },       // 2 imams
  { role: 'member', count: 28 }     // 28 members
]

let userIndex = 0
roles.forEach(({ role, count }) => {
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[userIndex % firstNames.length]
    const lastName = lastNames[Math.floor(userIndex / firstNames.length) % lastNames.length]

    testUsers.push({
      email: `${role}${i > 0 ? i + 1 : ''}@test.com`,
      password: 'Test1234!',
      user_metadata: {
        full_name: `${firstName} ${lastName}`,
      },
      role: role
    })
    userIndex++
  }
})

async function seedUsers() {
  console.log('🌱 Seeding test users and assigning to organizations...\n')

  // Get Test Mosque organization
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', 'test-mosque')
    .single()

  if (!orgs) {
    console.error('❌ Test Mosque organization not found!')
    console.log('Run migration 00057 first to create test organization.')
    return
  }

  console.log(`🏢 Using organization: ${orgs.name} (${orgs.id})\n`)

  let created = 0
  let skipped = 0
  let errors = 0
  const createdUsers = []

  // Create auth users
  for (const userData of testUsers) {
    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existing = existingUsers?.users.find(u => u.email === userData.email)

      if (existing) {
        console.log(`⏭️  Skipped: ${userData.email} (already exists)`)
        skipped++
        createdUsers.push({ ...existing, role: userData.role })
        continue
      }

      // Create user
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: userData.user_metadata
      })

      if (error) {
        console.error(`❌ Error creating ${userData.email}:`, error.message)
        errors++
      } else {
        console.log(`✅ Created: ${userData.email} (${userData.user_metadata.full_name}) - ${userData.role}`)
        created++
        createdUsers.push({ ...data.user, role: userData.role })
      }
    } catch (err) {
      console.error(`❌ Exception creating ${userData.email}:`, err.message)
      errors++
    }
  }

  console.log(`\n📊 Auth Users Summary:`)
  console.log(`   ✅ Created: ${created}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log(`   📝 Total: ${testUsers.length}`)

  // Assign users to organization
  console.log('\n🔗 Assigning users to organization...\n')

  let assigned = 0
  for (const user of createdUsers) {
    try {
      const role = user.role

      // Assign based on role
      if (role === 'owner') {
        const { error } = await supabase
          .from('organization_owners')
          .insert({
            organization_id: orgs.id,
            user_id: user.id
          })
          .select()

        if (error && !error.message.includes('duplicate')) {
          console.error(`❌ Error assigning owner ${user.email}:`, error.message)
        } else if (!error) {
          console.log(`👑 Assigned owner: ${user.email}`)
          assigned++
        }
      } else if (role === 'delegate') {
        const { error } = await supabase
          .from('organization_delegates')
          .insert({
            organization_id: orgs.id,
            user_id: user.id
          })
          .select()

        if (error && !error.message.includes('duplicate')) {
          console.error(`❌ Error assigning delegate ${user.email}:`, error.message)
        } else if (!error) {
          console.log(`🤝 Assigned delegate: ${user.email}`)
          assigned++
        }
      } else {
        // Create member record for imam and member roles
        const { error } = await supabase
          .from('members')
          .insert({
            organization_id: orgs.id,
            user_id: user.id,
            first_name: (user.user_metadata?.full_name || '').split(' ')[0] || 'User',
            last_name: (user.user_metadata?.full_name || '').split(' ').slice(1).join(' ') || 'Test',
            email: user.email,
            role: role === 'imam' ? 'imam' : 'member',
            is_active: true,
            membership_status: 'active'
          })
          .select()

        if (error && !error.message.includes('duplicate')) {
          console.error(`❌ Error assigning member ${user.email}:`, error.message)
        } else if (!error) {
          console.log(`👤 Assigned ${role}: ${user.email}`)
          assigned++
        }
      }
    } catch (err) {
      console.error(`❌ Exception assigning ${user.email}:`, err.message)
    }
  }

  console.log(`\n📊 Assignment Summary:`)
  console.log(`   ✅ Assigned: ${assigned}`)

  // List all users
  console.log('\n👥 All users in database:')
  const { data: allUsers } = await supabase.auth.admin.listUsers()
  console.log(`   Total: ${allUsers?.users.length || 0} users`)

  console.log('\n✨ Done!')
  console.log('\n🔑 All test users have password: Test1234!')
}

seedUsers().catch(console.error)
