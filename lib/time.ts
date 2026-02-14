export function toSeconds(hours: number, minutes: number, seconds: number) {
  return hours * 3600 + minutes * 60 + seconds
}

export function fromSeconds(total: number) {
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return { hours, minutes, seconds }
}

export function formatTime(totalSeconds: number) {
  const { hours, minutes, seconds } = fromSeconds(totalSeconds)
  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":")
}
