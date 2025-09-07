import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME || 'salil_music_db')
  }
  return db
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Time blocks configuration
const timeBlocks = [
  { id: 'early-morning', name: 'Early Morning', start_hour: 4, end_hour: 8 },
  { id: 'morning', name: 'Morning', start_hour: 8, end_hour: 12 },
  { id: 'afternoon', name: 'Afternoon', start_hour: 12, end_hour: 16 },
  { id: 'evening', name: 'Evening', start_hour: 16, end_hour: 20 },
  { id: 'night', name: 'Night', start_hour: 20, end_hour: 24 },
  { id: 'late-night', name: 'Late Night', start_hour: 0, end_hour: 4 }
]

// Sample playlists data
const samplePlaylists = [
  {
    id: uuidv4(),
    name: 'Dawn Serenity',
    time_block: 'early-morning',
    start_time: '04:00',
    end_time: '08:00'
  },
  {
    id: uuidv4(),
    name: 'Coffee & Energy',
    time_block: 'morning',
    start_time: '08:00',
    end_time: '12:00'
  },
  {
    id: uuidv4(),
    name: 'Afternoon Flow',
    time_block: 'afternoon',
    start_time: '12:00',
    end_time: '16:00'
  },
  {
    id: uuidv4(),
    name: 'Golden Hour',
    time_block: 'evening',
    start_time: '16:00',
    end_time: '20:00'
  },
  {
    id: uuidv4(),
    name: 'Night Vibes',
    time_block: 'night',
    start_time: '20:00',
    end_time: '00:00'
  },
  {
    id: uuidv4(),
    name: 'Deep Sleep',
    time_block: 'late-night',
    start_time: '00:00',
    end_time: '04:00'
  }
]

// Sample songs data
const sampleSongs = [
  // Early Morning songs
  { id: uuidv4(), playlist_id: null, title: 'Morning Mist', artist: 'Nature Sounds', url: '/music/03.mp3', time_block: 'early-morning' },
  { id: uuidv4(), playlist_id: null, title: 'Gentle Sunrise', artist: 'Ambient Dreams', url: '/music/05.mp3', time_block: 'early-morning' },
  { id: uuidv4(), playlist_id: null, title: 'Bird Song Symphony', artist: 'Forest Echoes', url: '/music/06.mp3', time_block: 'early-morning' },
  
  // Morning songs
  { id: uuidv4(), playlist_id: null, title: 'Fresh Start', artist: 'Positive Vibes', url: '/music/03.mp3', time_block: 'morning' },
  { id: uuidv4(), playlist_id: null, title: 'Morning Motivation', artist: 'Upbeat Collective', url: '/music/05.mp3', time_block: 'morning' },
  { id: uuidv4(), playlist_id: null, title: 'New Day Rising', artist: 'Energy Boost', url: '/music/06.mp3', time_block: 'morning' },
  
  // Afternoon songs
  { id: uuidv4(), playlist_id: null, title: 'Focus Mode', artist: 'Productivity Mix', url: '/music/03.mp3', time_block: 'afternoon' },
  { id: uuidv4(), playlist_id: null, title: 'Steady Rhythm', artist: 'Work Beats', url: '/music/05.mp3', time_block: 'afternoon' },
  { id: uuidv4(), playlist_id: null, title: 'Creative Energy', artist: 'Flow State', url: '/music/06.mp3', time_block: 'afternoon' },
  
  // Evening songs
  { id: uuidv4(), playlist_id: null, title: 'Sunset Dreams', artist: 'Chill Collective', url: '/music/07.mp3', time_block: 'evening' },
  { id: uuidv4(), playlist_id: null, title: 'Evening Breeze', artist: 'Relaxed Vibes', url: '/music/08.mp3', time_block: 'evening' },
  { id: uuidv4(), playlist_id: null, title: 'Twilight Glow', artist: 'Ambient Hour', url: '/music/09.mp3', time_block: 'evening' },
  
  // Night songs
  { id: uuidv4(), playlist_id: null, title: 'City Lights', artist: 'Urban Nights', url: '/music/07.mp3', time_block: 'night' },
  { id: uuidv4(), playlist_id: null, title: 'Midnight Groove', artist: 'Night Owls', url: '/music/08.mp3', time_block: 'night' },
  { id: uuidv4(), playlist_id: null, title: 'Starlit Sky', artist: 'Evening Jazz', url: '/music/09.mp3', time_block: 'night' },
  
  // Late Night songs
  { id: uuidv4(), playlist_id: null, title: 'Peaceful Slumber', artist: 'Sleep Sounds', url: '/music/03.mp3', time_block: 'late-night' },
  { id: uuidv4(), playlist_id: null, title: 'Night Rain', artist: 'Calm Waters', url: '/music/05.mp3', time_block: 'late-night' },
  { id: uuidv4(), playlist_id: null, title: 'Dream State', artist: 'Soft Melodies', url: '/music/06.mp3', time_block: 'late-night' }
]

// Initialize database with sample data
async function initializeDatabase() {
  try {
    const db = await connectToMongo()
    
    // Clear existing data and reinitialize
    await db.collection('playlists').deleteMany({})
    await db.collection('songs').deleteMany({})
    
    // Insert sample playlists
    await db.collection('playlists').insertMany(samplePlaylists)
    
    // Update songs with playlist IDs and insert them
    const insertedPlaylists = await db.collection('playlists').find().toArray()
    
    const songsWithPlaylistIds = sampleSongs.map(song => {
      const matchingPlaylist = insertedPlaylists.find(p => p.time_block === song.time_block)
      return {
        ...song,
        playlist_id: matchingPlaylist ? matchingPlaylist.id : null
      }
    })
    
    await db.collection('songs').insertMany(songsWithPlaylistIds)
    
    console.log('Database initialized with sample data')
  } catch (error) {
    console.error('Database initialization error:', error)
  }
}

// Get current time block based on hour
function getCurrentTimeBlock() {
  const now = new Date()
  const hour = now.getHours()
  
  for (const block of timeBlocks) {
    if (block.start_hour <= block.end_hour) {
      // Normal range (e.g., 8-12)
      if (hour >= block.start_hour && hour < block.end_hour) {
        return block.id
      }
    } else {
      // Overnight range (e.g., late night 0-4)
      if (hour >= block.start_hour || hour < block.end_hour) {
        return block.id
      }
    }
  }
  return 'early-morning' // fallback
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    const db = await connectToMongo()
    
    // Initialize database on first request
    await initializeDatabase()

    // Root endpoint
    if (route === '/' && method === 'GET') {
      return handleCORS(NextResponse.json({ 
        message: "Salil Music Player API",
        version: "1.0.0",
        endpoints: [
          "GET /api/current-playlist",
          "GET /api/playlist/:id", 
          "GET /api/playlists",
          "GET /api/songs"
        ]
      }))
    }

    // Get current playlist based on time
    if (route === '/current-playlist' && method === 'GET') {
      const currentTimeBlock = getCurrentTimeBlock()
      
      const playlist = await db.collection('playlists')
        .findOne({ time_block: currentTimeBlock })
      
      if (!playlist) {
        return handleCORS(NextResponse.json(
          { error: "No playlist found for current time" }, 
          { status: 404 }
        ))
      }

      // Get songs for this playlist
      const songs = await db.collection('songs')
        .find({ playlist_id: playlist.id })
        .toArray()

      const cleanedSongs = songs.map(({ _id, ...rest }) => rest)

      // Return the playlist with songs in the format expected by frontend
      return handleCORS(NextResponse.json({
        playlist: { ...playlist, _id: undefined },
        songs: cleanedSongs,
        current_time_block: currentTimeBlock
      }))
    }

    // Get songs by playlist (must come before general playlist route)
    if (route.startsWith('/playlist/') && route.endsWith('/songs') && method === 'GET') {
      const playlistId = route.split('/')[2]
      
      const songs = await db.collection('songs')
        .find({ playlist_id: playlistId })
        .toArray()

      const cleanedSongs = songs.map(({ _id, ...rest }) => rest)
      
      return handleCORS(NextResponse.json(cleanedSongs))
    }

    // Get specific playlist by ID
    if (route.startsWith('/playlist/') && method === 'GET') {
      const playlistId = route.split('/')[2]
      
      const playlist = await db.collection('playlists')
        .findOne({ id: playlistId })
      
      if (!playlist) {
        return handleCORS(NextResponse.json(
          { error: "Playlist not found" }, 
          { status: 404 }
        ))
      }

      const songs = await db.collection('songs')
        .find({ playlist_id: playlistId })
        .toArray()

      const cleanedSongs = songs.map(({ _id, ...rest }) => rest)

      return handleCORS(NextResponse.json({
        playlist: { ...playlist, _id: undefined },
        songs: cleanedSongs
      }))
    }

    // Get all playlists
    if (route === '/playlists' && method === 'GET') {
      const playlists = await db.collection('playlists')
        .find({})
        .toArray()

      const cleanedPlaylists = playlists.map(({ _id, ...rest }) => rest)
      
      return handleCORS(NextResponse.json(cleanedPlaylists))
    }

    // Get all songs
    if (route === '/songs' && method === 'GET') {
      const songs = await db.collection('songs')
        .find({})
        .toArray()

      const cleanedSongs = songs.map(({ _id, ...rest }) => rest)
      
      return handleCORS(NextResponse.json(cleanedSongs))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` }, 
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error", details: error.message }, 
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute