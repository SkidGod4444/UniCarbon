import type React from "react"
import { useState, useEffect } from "react"
import { Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ value, onChange }) => {
  const [preview, setPreview] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (value) {
      setPreview(value)
    }
  }, [value])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPreview(result)
        onChange(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPreview(result)
        onChange(result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setPreview(null)
    onChange("")
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative rounded-md overflow-hidden border border-gray-200">
          <div className="aspect-video relative">
            <img src={preview || "/placeholder.svg"} alt="Property preview" className="object-cover aspect-video" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging ? "border-black bg-gray-50" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("image-upload")?.click()}
        >
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-600 mb-1">Drag and drop an image, or click to browse</p>
          <p className="text-xs text-gray-400">Supported formats: JPG, PNG, WebP</p>
          <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      )}
    </div>
  )
}
