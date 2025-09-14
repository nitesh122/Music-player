'use client'

import { useState, useEffect, useRef } from 'react'
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'

const timeBlocks = [
  { id: 'early-morning', name: 'Early Morning', time: '4-8 AM', start: 4, end: 8, color: '#FFE4B5' },
  { id: 'morning', name: 'Morning', time: '8 AM-12 PM', start: 8, end: 12, color: '#FFD700' },
  { id: 'afternoon', name: 'Afternoon', time: '12-4 PM', start: 12, end: 16, color: '#FF8C00' },
  { id: 'evening', name: 'Evening', time: '4-8 PM', start: 16, end: 20, color: '#FF6347' },
  { id: 'night', name: 'Night', time: '8 PM-12 AM', start: 20, end: 24, color: '#4B0082' },
  { id: 'late-night', name: 'Late Night', time: '12-4 AM', start: 0, end: 4, color: '#191970' }
]

const SalilMusicPlayer = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSong, setCurrentSong] = useState(0)
  const [volume, setVolume] = useState(75)
  const [currentPlaylist, setCurrentPlaylist] = useState(null)
  const [selectedTimeBlock, setSelectedTimeBlock] = useState(null)
  const audioRef = useRef(null)

  // Get current time block based on hour
  const getCurrentTimeBlock = (time = new Date()) => {
    const hour = time.getHours()
    for (const block of timeBlocks) {
      if (block.start <= block.end) {
        // Normal range (e.g., 8-12)
        if (hour >= block.start && hour < block.end) return block
      } else {
        // Overnight range (e.g., late night 0-4)
        if (hour >= block.start || hour < block.end) return block
      }
    }
    return timeBlocks[0] // fallback
  }

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch the current playlist based on time
  useEffect(() => {
    const fetchCurrentPlaylist = async () => {
      try {
        const response = await fetch('/api/current-playlist')
        const data = await response.json()
        if (!selectedTimeBlock && data && data.playlist && data.songs) {
          setCurrentPlaylist({ name: data.playlist.name, songs: data.songs })
          setCurrentSong(0)
        }
      } catch (error) {
        console.error('Failed to fetch current playlist:', error)
      }
    }

    fetchCurrentPlaylist()
  }, [currentTime, selectedTimeBlock])

  // Update playlist when time block changes (if structure had block keys)
  useEffect(() => {
    const activeBlock = getCurrentTimeBlock(currentTime)
    if (
      !selectedTimeBlock &&
      currentPlaylist &&
      typeof currentPlaylist === 'object' &&
      currentPlaylist[activeBlock.id]
    ) {
      setCurrentPlaylist(currentPlaylist[activeBlock.id])
    }
  }, [currentTime, selectedTimeBlock, currentPlaylist])

  // Initialize with current time block if currentPlaylist is a map (safety no-op for API shape)
  useEffect(() => {
    const activeBlock = getCurrentTimeBlock()
    if (currentPlaylist && typeof currentPlaylist === 'object' && currentPlaylist[activeBlock.id]) {
      setCurrentPlaylist(currentPlaylist[activeBlock.id])
    }
  }, [currentPlaylist])

  // This effect handles playing/pausing when the isPlaying state changes
  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current
        .play()
        .catch(error => console.error('Error playing audio:', error))
    } else {
      audioRef.current.pause()
    }
  }, [isPlaying])

  // This effect handles song changes
  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying && currentPlaylist) {
      audioRef.current
        .play()
        .catch(error => console.error('Error playing audio:', error))
    }
  }, [currentSong, currentPlaylist, isPlaying])

  // This effect handles volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  // UPDATED: selectTimeBlock to fetch playlist by time_block
  const selectTimeBlock = async (block) => {
    setSelectedTimeBlock(block)
    try {
      const playlistsRes = await fetch('/api/playlists')
      const playlists = await playlistsRes.json()
      const match = Array.isArray(playlists)
        ? playlists.find(p => p.time_block === block.id)
        : null
      if (match) {
        const songsRes = await fetch(`/api/playlist/${match.id}/songs`)
        const songs = await songsRes.json()
        setCurrentPlaylist({ name: match.name, songs })
      }
      setCurrentSong(0)
      setIsPlaying(false)
    } catch (error) {
      console.error(`Failed to fetch playlist for ${block.name}:`, error)
    }
  }

  const resetToCurrentTime = () => {
    setSelectedTimeBlock(null)
    setCurrentSong(0)
    // The fetchCurrentPlaylist useEffect will automatically fetch the current playlist
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current?.pause()
    } else {
      audioRef.current?.play()
    }
    setIsPlaying(!isPlaying)
  }

  const nextSong = () => {
    if (currentPlaylist?.songs && currentSong < currentPlaylist.songs.length - 1) {
      setCurrentSong(currentSong + 1)
    } else {
      setCurrentSong(0)
    }
  }

  const prevSong = () => {
    if (currentSong > 0) {
      setCurrentSong(currentSong - 1)
    } else if (currentPlaylist?.songs) {
      setCurrentSong(currentPlaylist.songs.length - 1)
    }
  }

  const createTimeDialPath = () => {
    const centerX = 300
    const centerY = 300
    const radius = 200
    const segmentAngle = 360 / timeBlocks.length

    return timeBlocks.map((block, index) => {
      const startAngle = (index * segmentAngle - 90) * (Math.PI / 180)
      const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180)

      const x1 = centerX + radius * Math.cos(startAngle)
      const y1 = centerY + radius * Math.sin(startAngle)
      const x2 = centerX + radius * Math.cos(endAngle)
      const y2 = centerY + radius * Math.sin(endAngle)

      const largeArcFlag = segmentAngle > 180 ? 1 : 0

      return {
        ...block,
        path: `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`,
        textX: centerX + (radius * 0.7) * Math.cos((startAngle + endAngle) / 2),
        textY: centerY + (radius * 0.7) * Math.sin((startAngle + endAngle) / 2),
      }
    })
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const getActiveTimeBlock = () => {
    return selectedTimeBlock || getCurrentTimeBlock(currentTime)
  }

  const activeBlock = getActiveTimeBlock()
  const dialSegments = createTimeDialPath()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-300 via-pink-300 to-purple-400 flex flex-col items-center justify-center p-4">
      <audio
        ref={audioRef}
        src={currentPlaylist?.songs?.[currentSong]?.url || ''}
        onEnded={nextSong}
      />
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-wide">
          Salil Music Player
        </h1>
        <div className="text-xl md:text-2xl text-white/90 font-medium">
          {formatTime(currentTime)}
        </div>
      </div>

      {/* Circular Time Dial */}
      <div className="relative mb-8">
        <svg width="600" height="600" className="filter drop-shadow-2xl">
          {/* Outer glow */}
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Time segments */}
          {dialSegments.map((segment, index) => {
            const isActive = segment.id === activeBlock.id
            return (
              <g key={segment.id}>
                <path
                  d={segment.path}
                  fill={isActive ? segment.color : `${segment.color}80`}
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth="2"
                  className={`cursor-pointer transition-all duration-300 ${isActive ? 'filter-[url(#glow)]' : 'hover:opacity-80'}`}
                  onClick={() => selectTimeBlock(segment)}
                />
                <text
                  x={segment.textX}
                  y={segment.textY}
                  textAnchor="middle"
                  className="fill-white text-sm font-medium pointer-events-none"
                  style={{ fontSize: '12px' }}
                >
                  {segment.name.split(' ')[0]}
                </text>
                <text
                  x={segment.textX}
                  y={segment.textY + 12}
                  textAnchor="middle"
                  className="fill-white text-xs opacity-80 pointer-events-none"
                  style={{ fontSize: '10px' }}
                >
                  {segment.time}
                </text>
              </g>
            )
          })}

          {/* Center play button */}
          <circle
            cx="300"
            cy="300"
            r="80"
            fill="rgba(255, 255, 255, 0.9)"
            className="cursor-pointer hover:fill-white transition-all duration-300 filter drop-shadow-lg"
            onClick={togglePlayPause}
          />

          {/* Play/Pause icon */}
          {isPlaying ? (
            <rect
              x="285"
              y="275"
              width="30"
              height="50"
              fill="rgba(0, 0, 0, 0.8)"
              className="pointer-events-none"
            />
          ) : (
            <polygon
              points="285,275 285,325 335,300"
              fill="rgba(0, 0, 0, 0.8)"
              className="pointer-events-none"
            />
          )}
        </svg>

        {/* Current time block label */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/20 backdrop-blur-md rounded-full px-6 py-2">
            <div className="text-white text-center">
              <div className="font-semibold">{activeBlock.name}</div>
              <div className="text-sm opacity-80">{activeBlock.time}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Playlist Info */}
      {currentPlaylist && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white p-6 mb-6 max-w-md w-full">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">{currentPlaylist.name}</h3>
            {currentPlaylist?.songs?.[currentSong] && (
              <div className="space-y-1">
                <div className="font-medium">{currentPlaylist.songs[currentSong].title}</div>
                <div className="text-sm opacity-80">by {currentPlaylist.songs[currentSong].artist}</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Audio Controls */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white p-6 max-w-md w-full">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevSong}
            className="text-white hover:bg-white/20"
          >
            <SkipBack size={20} />
          </Button>

          <Button
            variant="ghost"
            size="lg"
            onClick={togglePlayPause}
            className="text-white hover:bg-white/20 rounded-full w-12 h-12"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={nextSong}
            className="text-white hover:bg-white/20"
          >
            <SkipForward size={20} />
          </Button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <Volume2 size={16} />
          <Slider
            value={[volume]}
            onValueChange={(value) => setVolume(value[0])}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm w-8">{volume}</span>
        </div>

        {/* Reset to current time button */}
        {selectedTimeBlock && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToCurrentTime}
              className="text-white border-white/30 hover:bg-white/20"
            >
              Back to Current Time
            </Button>
          </div>
        )}
      </Card>

      {/* Current Playlist Songs */}
      {currentPlaylist && (
        <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white p-4 mt-4 max-w-md w-full">
          <h4 className="font-medium mb-3 text-center">Playlist</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {currentPlaylist?.songs?.map((song, index) => (
              <div
                key={song.id}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  index === currentSong ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
                onClick={() => setCurrentSong(index)}
              >
                <div>
                  <div className="text-sm font-medium">{song.title}</div>
                  <div className="text-xs opacity-70">{song.artist}</div>
                </div>
                {index === currentSong && isPlaying && (
                  <div className="text-xs">♪</div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

const App = () => {
  return (
    <div className="App">
      <SalilMusicPlayer />
    </div>
  )
}

export default App