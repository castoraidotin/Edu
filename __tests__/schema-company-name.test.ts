import fs from 'fs'
import path from 'path'

describe('company/team name database schema', () => {
  const baseSchema = fs.readFileSync(path.join(process.cwd(), 'supabase', 'profiles.sql'), 'utf-8')
  const migration = fs.readFileSync(
    path.join(process.cwd(), 'supabase', 'migration-company-name.sql'),
    'utf-8'
  )

  it('defines the optional company_name column for new databases', () => {
    expect(baseSchema).toMatch(/company_name\s+TEXT/i)
    expect(baseSchema).not.toMatch(/company_name\s+TEXT\s+NOT NULL/i)
  })

  it('provides an idempotent migration for existing databases', () => {
    expect(migration).toMatch(/ADD COLUMN IF NOT EXISTS company_name TEXT/i)
    expect(migration).toMatch(/IF NOT EXISTS[\s\S]*profiles_company_name_format/i)
  })

  it('enforces the same alphanumeric and length rules in the database', () => {
    for (const sql of [baseSchema, migration]) {
      expect(sql).toMatch(/char_length\(company_name\)\s*<=\s*100/i)
      expect(sql).toContain("company_name ~ '^[A-Za-z0-9]+$'")
    }
  })
})
