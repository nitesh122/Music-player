import './globals.css'

export const metadata = {
  title: 'Salil Music Player - Time-Based Music Experience',
  description: 'A unique music player that automatically plays playlists based on the time of day',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}