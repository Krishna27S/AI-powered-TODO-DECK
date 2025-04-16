'use client'

import { useEffect, useState } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  DocumentData,
} from 'firebase/firestore'
import LogoutButton from '@/components/ui/logout-button'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [tasks, setTasks] = useState<DocumentData[]>([])
  const router = useRouter()

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/')
        return
      }

      // Check user role
      const userDocRef = doc(db, 'users', currentUser.uid)
      const userSnap = await getDoc(userDocRef)
      const role = userSnap.exists() ? userSnap.data()?.role : 'user'

      if (role === 'admin') {
        router.push('/admin')
        return
      }

      setUser(currentUser)

      // Real-time listener for user-specific tasks
      const tasksRef = collection(db, 'tasks') // ✅ Correct usage
      const q = query(tasksRef, where('uid', '==', currentUser.uid))

      const unsubscribeTasks = onSnapshot(q, (snapshot) => {
        const userTasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setTasks(userTasks)
        setLoading(false)
      })

      return () => unsubscribeTasks()
    })

    return () => unsubscribeAuth()
  }, [router])

  if (loading) return <p className="p-4">Loading your dashboard...</p>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Welcome, {user.email}</h1>
        <LogoutButton />
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Your Tasks</h2>
        {tasks.length > 0 ? (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="border p-4 rounded shadow">
                <p className="font-medium">{task.title}</p>
                <p className="text-sm text-gray-500">{task.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No tasks yet. Start adding some!</p>
        )}
      </div>
    </div>
  )
}
