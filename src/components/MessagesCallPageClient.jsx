"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  Camera,
  CameraOff,
  Loader2,
  Mic,
  MicOff,
  PhoneCall,
  PhoneOff,
  Volume2,
  VolumeX,
  X,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function stopMediaStream(stream) {
  stream?.getTracks().forEach((track) => track.stop())
}

function formatCallTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60).toString().padStart(2, "0")
  return `${minutes}:${rest}`
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function MessagesCallPageClient({ currentUser }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const conversationId = searchParams.get("conversationId") || ""
  const requestedCallId = searchParams.get("callId") || ""
  const requestedMode = searchParams.get("mode") === "video" ? "video" : "audio"
  const restartToken = searchParams.get("restart") || ""
  const incoming = searchParams.get("incoming") === "1"
  const debugCall = searchParams.get("debug") === "1"

  const [conversation, setConversation] = useState(null)
  const [callId, setCallId] = useState(requestedCallId)
  const [mode, setMode] = useState(requestedMode)
  const [status, setStatus] = useState(incoming ? "Đang kết nối..." : "Đang đổ chuông...")
  const [error, setError] = useState("")
  const [localStream, setLocalStream] = useState(null)
  const [remoteStream, setRemoteStream] = useState(null)
  const [micEnabled, setMicEnabled] = useState(true)
  const [speakerEnabled, setSpeakerEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(requestedMode === "video")
  const [seconds, setSeconds] = useState(0)
  const [ending, setEnding] = useState(false)
  const [booting, setBooting] = useState(true)
  const [callEnded, setCallEnded] = useState(false)
  const [localPreviewPosition, setLocalPreviewPosition] = useState(null)

  const peerRef = useRef(null)
  const localVideoRef = useRef(null)
  const localPreviewRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const remoteAudioRef = useRef(null)
  const handledSignalIdsRef = useRef(new Set())
  const pendingCandidatesRef = useRef([])
  const callIdRef = useRef(callId)
  const endedRef = useRef(false)
  const localPreviewDragRef = useRef(null)

  const otherUser = conversation?.otherUser || {}
  const displayName = otherUser.displayName || otherUser.username || "Cuộc gọi"
  const initials = displayName.slice(0, 2).toUpperCase()
  const isVideo = mode === "video"
  const controlsDisabled = booting || Boolean(error) || !localStream

  const closeCall = useCallback(() => {
    if (typeof window !== "undefined" && window.opener) {
      window.close()
      window.setTimeout(() => {
        router.push(conversationId ? `/messages?conversationId=${encodeURIComponent(conversationId)}` : "/messages")
      }, 120)
      return
    }
    router.push(conversationId ? `/messages?conversationId=${encodeURIComponent(conversationId)}` : "/messages")
  }, [conversationId, router])

  const recall = useCallback(() => {
    const url = `/messages/call?conversationId=${encodeURIComponent(conversationId)}&mode=${encodeURIComponent(mode)}&restart=${Date.now()}`
    router.push(url)
  }, [conversationId, mode, router])

  useEffect(() => {
    callIdRef.current = callId
  }, [callId])

  useEffect(() => {
    let active = true
    fetch("/api/messages")
      .then((response) => response.json())
      .then((data) => {
        if (!active) return
        const items = Array.isArray(data?.items) ? data.items : []
        setConversation(items.find((item) => item.id === conversationId) || null)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [conversationId])

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream
  }, [localStream])

  const clampLocalPreviewPosition = useCallback((position) => {
    if (typeof window === "undefined") return position
    const rect = localPreviewRef.current?.getBoundingClientRect()
    const width = rect?.width || 96
    const height = rect?.height || 128
    const padding = 12
    return {
      x: clamp(position.x, padding, window.innerWidth - width - padding),
      y: clamp(position.y, padding, window.innerHeight - height - padding),
    }
  }, [])

  useEffect(() => {
    if (!isVideo || !localStream || typeof window === "undefined") return undefined

    const placePreview = () => {
      const rect = localPreviewRef.current?.getBoundingClientRect()
      const width = rect?.width || 96
      const height = rect?.height || 128
      setLocalPreviewPosition((position) => {
        if (position) return clampLocalPreviewPosition(position)
        const bottomOffset = window.matchMedia("(min-width: 640px)").matches ? 144 : 128
        return clampLocalPreviewPosition({
          x: window.innerWidth - width - 12,
          y: window.innerHeight - height - bottomOffset,
        })
      })
    }

    placePreview()
    window.addEventListener("resize", placePreview)
    window.visualViewport?.addEventListener("resize", placePreview)
    return () => {
      window.removeEventListener("resize", placePreview)
      window.visualViewport?.removeEventListener("resize", placePreview)
    }
  }, [clampLocalPreviewPosition, isVideo, localStream])

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream
  }, [remoteStream])

  useEffect(() => {
    if (remoteAudioRef.current) remoteAudioRef.current.muted = !speakerEnabled
    if (remoteVideoRef.current) remoteVideoRef.current.muted = !speakerEnabled
  }, [speakerEnabled, remoteStream])

  useEffect(() => {
    if (callEnded) return undefined
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [callEnded])

  const logCallDebug = useCallback((label, detail = {}) => {
    if (!debugCall) return
    console.info("[FishViet call]", label, detail)
  }, [debugCall])

  const postSignal = useCallback(async (targetCallId, type, payload) => {
    const response = await fetch(`/api/messages/calls/${targetCallId}/signals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload }),
    })
    const data = await response.json().catch(() => null)
    logCallDebug("post signal", { callId: targetCallId, type, status: response.status, ok: response.ok })
    if (!response.ok) throw new Error(data?.error || `Không thể gửi tín hiệu ${type}`)
    return data
  }, [logCallDebug])

  const endCall = useCallback(async ({ notify = true } = {}) => {
    if (endedRef.current) return
    endedRef.current = true
    setEnding(true)
    const activeCallId = callIdRef.current
    if (notify && activeCallId) {
      fetch(`/api/messages/calls/${activeCallId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end" }),
      }).catch(() => {})
    }
    peerRef.current?.close()
    peerRef.current = null
    stopMediaStream(localStream)
    stopMediaStream(remoteStream)
    setLocalStream(null)
    setRemoteStream(null)
    setCallId("")
    setStatus("Cuộc gọi đã kết thúc")
    setBooting(false)
    setEnding(false)
    setCallEnded(true)
  }, [localStream, remoteStream])

  const createPeer = useCallback((targetCallId, stream) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: ["stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"] }],
    })
    stream.getTracks().forEach((track) => peer.addTrack(track, stream))
    peer.onicecandidate = (event) => {
      if (event.candidate) postSignal(targetCallId, "candidate", event.candidate.toJSON()).catch(() => {})
    }
    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0])
      setStatus("Đã kết nối")
    }
    peer.onconnectionstatechange = () => {
      if (["failed", "disconnected"].includes(peer.connectionState)) setStatus("Đang thử kết nối lại...")
      if (peer.connectionState === "connected") setStatus("Đã kết nối")
      if (peer.connectionState === "closed") setStatus("Cuộc gọi đã kết thúc")
    }
    peerRef.current = peer
    return peer
  }, [postSignal])

  const handleSignal = useCallback(async (signal) => {
    if (!signal?.id || handledSignalIdsRef.current.has(signal.id)) return
    handledSignalIdsRef.current.add(signal.id)
    logCallDebug("receive signal", { id: signal.id, type: signal.type, createdAt: signal.createdAt })
    if (signal.type === "accepted") {
      setStatus("Đã nhận cuộc gọi, đang kết nối...")
      const peer = peerRef.current
      const localDescription = peer?.localDescription
      if (localDescription?.type === "offer" && callIdRef.current) {
        await postSignal(callIdRef.current, "offer", localDescription)
      }
      return
    }
    if (["declined", "ended"].includes(signal.type)) {
      await endCall({ notify: false })
      return
    }
    const peer = peerRef.current
    if (!peer) return
    const flushPendingCandidates = async () => {
      if (!peer.remoteDescription || !pendingCandidatesRef.current.length) return
      const candidates = pendingCandidatesRef.current
      pendingCandidatesRef.current = []
      for (const candidate of candidates) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate))
      }
      logCallDebug("flush candidates", { count: candidates.length })
    }
    if (signal.type === "offer") {
      if (peer.currentRemoteDescription) return
      logCallDebug("handle offer", {
        signalingState: peer.signalingState,
        connectionState: peer.connectionState,
        iceConnectionState: peer.iceConnectionState,
      })
      await peer.setRemoteDescription(new RTCSessionDescription(signal.payload))
      await flushPendingCandidates()
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      await postSignal(callIdRef.current, "answer", answer)
      logCallDebug("answer sent", { signalingState: peer.signalingState })
      return
    }
    if (signal.type === "answer") {
      if (peer.currentRemoteDescription) return
      await peer.setRemoteDescription(new RTCSessionDescription(signal.payload))
      await flushPendingCandidates()
      return
    }
    if (signal.type === "candidate") {
      if (!peer.remoteDescription) {
        pendingCandidatesRef.current.push(signal.payload)
        logCallDebug("queue candidate", { count: pendingCandidatesRef.current.length })
        return
      }
      await peer.addIceCandidate(new RTCIceCandidate(signal.payload))
    }
  }, [endCall, logCallDebug, postSignal])

  useEffect(() => {
    if (!conversationId || typeof navigator === "undefined") return undefined
    let cancelled = false

    const boot = async () => {
      try {
        endedRef.current = false
        handledSignalIdsRef.current = new Set()
        pendingCandidatesRef.current = []
        setCallEnded(false)
        setEnding(false)
        setError("")
        setSeconds(0)
        setRemoteStream(null)
        setBooting(true)
        if (!window.isSecureContext) {
          throw new Error("Mobile chỉ cho phép gọi trên HTTPS hoặc localhost.")
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Trình duyệt này chưa hỗ trợ gọi bằng camera/micro.")
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: requestedMode === "video" ? { facingMode: "user" } : false,
        })
        if (cancelled) {
          stopMediaStream(stream)
          return
        }
        setLocalStream(stream)
        setCameraEnabled(requestedMode === "video")

        if (requestedCallId) {
          setCallId(requestedCallId)
          setMode(requestedMode)
          createPeer(requestedCallId, stream)
          if (incoming) {
            await fetch(`/api/messages/calls/${requestedCallId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "accept" }),
            })
          }
          setStatus("Đang chờ tín hiệu...")
          return
        }

        const response = await fetch("/api/messages/calls", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId, mode: requestedMode }),
        })
        const session = await response.json()
        if (!response.ok) throw new Error(session.error || "Không thể bắt đầu cuộc gọi")
        if (cancelled) return
        setCallId(session.id)
        setMode(session.mode)
        const peer = createPeer(session.id, stream)
        const offer = await peer.createOffer()
        await peer.setLocalDescription(offer)
        await postSignal(session.id, "offer", offer)
        setStatus("Đang đổ chuông...")
      } catch (caught) {
        setError(caught.message || "Không thể mở cuộc gọi.")
      } finally {
        if (!cancelled) setBooting(false)
      }
    }

    boot()
    return () => {
      cancelled = true
    }
  }, [conversationId, createPeer, incoming, postSignal, requestedCallId, requestedMode, restartToken])

  useEffect(() => {
    if (!callId || callEnded) return undefined
    let active = true
    let after = ""
    const poll = async () => {
      try {
        const url = `/api/messages/calls/${callId}/signals${after ? `?after=${encodeURIComponent(after)}` : ""}`
        const response = await fetch(url)
        const data = await response.json()
        logCallDebug("poll signals", {
          callId,
          status: response.status,
          ok: response.ok,
          count: Array.isArray(data.items) ? data.items.length : 0,
          types: Array.isArray(data.items) ? data.items.map((signal) => signal.type) : [],
        })
        if (!active || !response.ok) return
        for (const signal of data.items || []) {
          try {
            await handleSignal(signal)
          } catch (caught) {
            const message = caught?.message || "Không thể xử lý tín hiệu cuộc gọi"
            console.error("[FishViet call] signal error", {
              id: signal.id,
              type: signal.type,
              name: caught?.name,
              message,
              stack: caught?.stack,
            })
            logCallDebug("signal error", { id: signal.id, type: signal.type, message })
            if (active) setStatus("Đang thử kết nối lại...")
          }
          after = signal.createdAt
        }
      } catch (caught) {
        console.error("[FishViet call] poll error", caught)
        if (active) setStatus("Đang kết nối lại...")
      }
    }
    poll()
    const timer = window.setInterval(poll, 800)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [callEnded, callId, handleSignal, logCallDebug])

  useEffect(() => () => {
    peerRef.current?.close()
    stopMediaStream(localStream)
    stopMediaStream(remoteStream)
  }, [localStream, remoteStream])

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled
      setMicEnabled(track.enabled)
    })
  }

  const toggleSpeaker = () => {
    setSpeakerEnabled((enabled) => !enabled)
  }

  const toggleCamera = () => {
    localStream?.getVideoTracks().forEach((track) => {
      track.enabled = !track.enabled
      setCameraEnabled(track.enabled)
    })
  }

  const startLocalPreviewDrag = (event) => {
    if (!localPreviewPosition) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    localPreviewDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: localPreviewPosition.x,
      originY: localPreviewPosition.y,
    }
  }

  const moveLocalPreview = (event) => {
    const drag = localPreviewDragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setLocalPreviewPosition(clampLocalPreviewPosition({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    }))
  }

  const stopLocalPreviewDrag = (event) => {
    if (localPreviewDragRef.current?.pointerId === event.pointerId) {
      localPreviewDragRef.current = null
      event.currentTarget.releasePointerCapture?.(event.pointerId)
    }
  }

  const callLabel = useMemo(() => {
    if (callEnded) return "Cuộc gọi đã kết thúc"
    if (booting) return "Đang xin quyền thiết bị"
    if (error) return "Không thể kết nối"
    if (remoteStream) return formatCallTime(seconds)
    return status
  }, [booting, callEnded, error, remoteStream, seconds, status])

  if (callEnded) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center overflow-hidden bg-black px-4 text-white">
        <section className="flex w-full max-w-sm flex-col items-center text-center">
          <Avatar className="h-24 w-24 ring-1 ring-white/10 shadow-2xl">
            {otherUser.avatarUrl && <AvatarImage src={otherUser.avatarUrl} alt={displayName} className="object-cover" />}
            <AvatarFallback className="bg-zinc-800 text-2xl font-black text-white">{initials}</AvatarFallback>
          </Avatar>
          <h1 className="mt-5 max-w-full truncate text-2xl font-black tracking-normal">{displayName}</h1>
          <p className="mt-4 text-sm font-semibold text-white">Cuộc gọi đã kết thúc</p>

          <div className="mt-11 flex items-start justify-center gap-12">
            <button type="button" onClick={recall} className="group flex flex-col items-center gap-3" aria-label="Gọi lại">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#65d84e] text-white transition group-hover:bg-[#56c941]">
                <PhoneCall className="h-7 w-7" />
              </span>
              <span className="text-sm font-semibold text-white/55 group-hover:text-white">Gọi lại</span>
            </button>
            <button type="button" onClick={closeCall} className="group flex flex-col items-center gap-3" aria-label="Đóng">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 text-white transition group-hover:bg-zinc-700">
                <X className="h-7 w-7" />
              </span>
              <span className="text-sm font-semibold text-white/55 group-hover:text-white">Đóng</span>
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-[100dvh] overflow-hidden bg-black text-white">
      <section className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-black">
        {isVideo && remoteStream && (
          <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 h-full w-full bg-black object-cover" />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(39,39,42,0.45),rgba(0,0,0,0.95)_68%)]" />

        <header className="relative z-20 flex items-start justify-between gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={closeCall}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Quay lại tin nhắn"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <Avatar className="h-11 w-11 shrink-0 ring-2 ring-white/10">
              {otherUser.avatarUrl && <AvatarImage src={otherUser.avatarUrl} alt={displayName} className="object-cover" />}
              <AvatarFallback className="bg-zinc-800 text-sm font-black text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-bold sm:text-base">{displayName}</h1>
              <p className="truncate text-xs font-semibold text-white/55">{isVideo ? "Video call" : "Voice call"}</p>
            </div>
          </div>
        </header>

        <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 pb-36 pt-6 text-center sm:pb-40">
          <div className="flex max-w-md flex-col items-center">
            {(!isVideo || !remoteStream) && (
              <Avatar className="h-32 w-32 ring-4 ring-white/10 shadow-2xl sm:h-40 sm:w-40">
                {otherUser.avatarUrl && <AvatarImage src={otherUser.avatarUrl} alt={displayName} className="object-cover" />}
                <AvatarFallback className="bg-zinc-800 text-4xl font-black text-white">{initials}</AvatarFallback>
              </Avatar>
            )}
            <h2 className="mt-6 max-w-full truncate text-3xl font-black tracking-normal sm:text-4xl">{displayName}</h2>
            <p className="mt-2 text-sm font-semibold text-white/60">{callLabel}</p>
            {error && (
              <div className="mt-4 max-w-sm rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-100">
                <p>{error}</p>
                <button type="button" onClick={closeCall} className="mt-3 min-h-11 rounded-full bg-white px-5 text-sm font-bold text-black">
                  Quay lại tin nhắn
                </button>
              </div>
            )}
          </div>
        </div>

        {isVideo && localStream && (
          <div
            ref={localPreviewRef}
            className={`absolute z-20 h-32 w-24 touch-none select-none overflow-hidden rounded-2xl border border-white/15 bg-zinc-950 shadow-2xl sm:h-44 sm:w-32 ${localPreviewPosition ? "" : "bottom-32 right-3 sm:bottom-36 sm:right-6"}`}
            style={localPreviewPosition ? { left: localPreviewPosition.x, top: localPreviewPosition.y } : undefined}
            onPointerDown={startLocalPreviewDrag}
            onPointerMove={moveLocalPreview}
            onPointerUp={stopLocalPreviewDrag}
            onPointerCancel={stopLocalPreviewDrag}
            role="presentation"
          >
            <video ref={localVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
          </div>
        )}
        <audio ref={remoteAudioRef} autoPlay playsInline />

        <footer className="absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="scrollbar-none flex max-w-[calc(100vw-1.5rem)] items-center justify-center gap-2 overflow-x-auto rounded-full bg-zinc-950/75 px-3 py-3 shadow-2xl ring-1 ring-white/10 backdrop-blur-md sm:gap-3 sm:px-4">
            {isVideo && (
              <button type="button" onClick={toggleCamera} disabled={controlsDisabled} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition disabled:opacity-45 ${cameraEnabled ? "bg-zinc-700 text-white hover:bg-zinc-600" : "bg-white text-black hover:bg-zinc-200"}`} aria-label={cameraEnabled ? "Tắt camera" : "Bật camera"}>
                {cameraEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
              </button>
            )}
            <button type="button" onClick={toggleSpeaker} disabled={controlsDisabled || !remoteStream} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition disabled:opacity-45 ${speakerEnabled ? "bg-zinc-700 text-white hover:bg-zinc-600" : "bg-white text-black hover:bg-zinc-200"}`} aria-label={speakerEnabled ? "Tắt loa" : "Bật loa"}>
              {speakerEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </button>
            <button type="button" onClick={toggleMic} disabled={controlsDisabled} className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition disabled:opacity-45 ${micEnabled ? "bg-zinc-700 text-white hover:bg-zinc-600" : "bg-white text-black hover:bg-zinc-200"}`} aria-label={micEnabled ? "Tắt micro" : "Bật micro"}>
              {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </button>
            <button type="button" onClick={() => endCall()} disabled={ending} className="flex h-12 w-16 shrink-0 items-center justify-center rounded-full bg-red-500 text-white shadow-xl shadow-red-950/40 transition hover:bg-red-600 disabled:opacity-60" aria-label="Kết thúc cuộc gọi">
              {ending ? <Loader2 className="h-6 w-6 animate-spin" /> : <PhoneOff className="h-6 w-6" />}
            </button>
          </div>
        </footer>
      </section>
    </main>
  )
}
