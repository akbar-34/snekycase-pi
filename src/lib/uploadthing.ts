import { NextApiRequest, NextApiResponse } from 'next'
import { OurFileRouter } from '@/app/api/uploadthing/core'
import { generateReactHelpers } from '@uploadthing/react'

export const { useUploadThing, uploadFiles } =
  generateReactHelpers<OurFileRouter>()

// Define your API route handler
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Handle the request based on the method (GET, POST, etc.)
    if (req.method === 'POST') {
      // Handle file upload logic here
      // Example: const result = await uploadFiles(req.body);
      // res.status(200).json(result);
    } else {
      // Handle unsupported methods
      res.setHeader('Allow', ['POST'])
      res.status(405).end(`Method ${req.method} Not Allowed`)
    }
  } catch (error) {
    // Handle errors
    console.error('Error in uploadthing handler:', error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
}
