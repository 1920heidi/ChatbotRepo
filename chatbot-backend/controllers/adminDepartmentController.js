import { createDepartment, listDepartments } from '../services/departmentService.js'

export async function list(request, response) {
  try {
    const departments = await listDepartments()

    return response.json({ departments })
  } catch (error) {
    console.error('Listing departments failed:', error)

    return response.status(500).json({ error: 'Could not list departments.' })
  }
}

export async function create(request, response) {
  try {
    const { name } = request.body

    if (typeof name !== 'string' || !name.trim()) {
      return response.status(400).json({ error: 'A department name is required.' })
    }

    const department = await createDepartment(name.trim())

    if (!department) {
      return response.status(409).json({ error: 'A department with that name already exists.' })
    }

    return response.status(201).json({ department })
  } catch (error) {
    console.error('Creating department failed:', error)

    return response.status(500).json({ error: 'Could not create the department.' })
  }
}
