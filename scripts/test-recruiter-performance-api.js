/**
 * Quick test for admin recruiter-performance API.
 * Usage:
 *   node scripts/test-recruiter-performance-api.js
 *   node scripts/test-recruiter-performance-api.js https://api.jobsmato.com/api
 *   node scripts/test-recruiter-performance-api.js http://localhost:5000/api YOUR_ADMIN_JWT_TOKEN
 *
 * Without token: expects 401 (API is up, auth required).
 * With token: expects 200 and prints response summary.
 */

const baseUrl = process.argv[2] || 'http://localhost:5000/api'
const token = process.argv[3] || ''

const url = `${baseUrl}/admin/recruiter-performance/dod`
const headers = { 'Content-Type': 'application/json' }
if (token) headers['Authorization'] = `Bearer ${token}`

async function test() {
  console.log('Testing:', url)
  try {
    const res = await fetch(url, { headers, method: 'GET' })
    console.log('Status:', res.status, res.statusText)
    const text = await res.text()
    if (text) {
      try {
        const json = JSON.parse(text)
        if (json.rows) console.log('Rows:', json.rows.length)
        if (json.date) console.log('Date:', json.date)
        else console.log('Body (first 200 chars):', text.slice(0, 200))
      } catch {
        console.log('Body (first 200 chars):', text.slice(0, 200))
      }
    }
    if (res.ok) console.log('API is working.')
    else if (res.status === 401) console.log('API is up; admin token required.')
    else if (res.status === 404) console.log('Endpoint not found (not deployed or wrong base URL?).')
  } catch (e) {
    console.log('Error:', e.message)
    console.log('Is the backend running?')
  }
}

test()
