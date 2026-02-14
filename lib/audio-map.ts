const audioMap: Record<string, string> = {
  "/": "/audio/welcome.mp3",
  "/task": "/audio/task.mp3",
  "/assign": "/audio/assign.mp3",
  "/timer": "/audio/timer.mp3",
  "/report": "/audio/report.mp3",
}

export function getAudioForPath(pathname: string) {
  if (audioMap[pathname]) return audioMap[pathname]

  const match = Object.keys(audioMap).find((key) =>
    pathname.startsWith(key)
  )
  return match ? audioMap[match] : undefined
}

export { audioMap }
