import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Save, X } from "lucide-react"

export interface ProgressItem {
    id: string
    title: string
    isDone: boolean
}
interface ProgressManagerProps {
    progress: ProgressItem[]
    onChange: (progress: ProgressItem[]) => void
}

export function ProgressManager({ progress, onChange }: ProgressManagerProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<ProgressItem>>({})

    const handleAdd = () => {
        const newItem: ProgressItem = {
            id: uuidv4(),
            title: "",
            isDone: false,
        }
        setEditingId(newItem.id)
        setEditForm(newItem)
        onChange([...progress, newItem])
    }

    const handleEdit = (item: ProgressItem) => {
        setEditingId(item.id)
        setEditForm(item)
    }

    const handleSave = () => {
        if (editingId && editForm.title) {
            const updatedProgress = progress.map((item) =>
                item.id === editingId ? { ...item, title: editForm.title!, isDone: editForm.isDone! } : item,
            )
            onChange(updatedProgress)
            setEditingId(null)
            setEditForm({})
        }
    }

    const handleCancel = () => {
        if (editForm.title === "") {
            // If it's a new empty item, remove it
            onChange(progress.filter((item) => item.id !== editingId))
        }
        setEditingId(null)
        setEditForm({})
    }

    const handleDelete = (id: string) => {
        onChange(progress.filter((item) => item.id !== id))
        if (editingId === id) {
            setEditingId(null)
            setEditForm({})
        }
    }

    const handleToggle = (id: string, isDone: boolean) => {
        const updatedProgress = progress.map((item) => (item.id === id ? { ...item, isDone } : item))
        onChange(updatedProgress)
    }

    const completedCount = progress.filter((item) => item.isDone).length
    const totalCount = progress.length

    return (
        <div className="space-y-4">
            <hr />
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <h4 className="font-medium">Progress Tracking</h4>
                    {totalCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                            {completedCount}/{totalCount} completed
                        </Badge>
                    )}
                </div>
                <Button type="button" size="sm" onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                </Button>
            </div>

            <div className="space-y-3">
                {progress.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                        No progress items added yet. Click "Add Item" to create one.
                    </p>
                ) : (
                    progress.map((item) => (
                        <Card key={item.id} className="relative">
                            <CardContent className="pt-4">
                                {editingId === item.id ? (
                                    <div className="space-y-3">
                                        <div>
                                            <Input
                                                placeholder="Enter progress item title..."
                                                value={editForm.title || ""}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                className="peer h-4 w-4 rounded-sm border border-primary"
                                                id={`edit-${item.id}`}
                                                checked={editForm.isDone || false}
                                                onChange={(e) => setEditForm({ ...editForm, isDone: e.target.checked })}
                                            />
                                            <label
                                                htmlFor={`edit-${item.id}`}
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Mark as completed
                                            </label>
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                                                <X className="h-4 w-4 mr-1" />
                                                Cancel
                                            </Button>
                                            <Button type="button" size="sm" onClick={handleSave} disabled={!editForm.title}>
                                                <Save className="h-4 w-4 mr-1" />
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-3 flex-1">
                                            <input
                                                type="checkbox"
                                                className="peer size-4 rounded-sm border border-primary"
                                                id={item.id}
                                                checked={item.isDone}
                                                onChange={(e) => handleToggle(item.id, e.target.checked)}
                                            />
                                            <label
                                                htmlFor={item.id}
                                                className={`font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${item.isDone ? "line-through text-muted-foreground" : ""
                                                    }`}
                                            >
                                                {item.title}
                                            </label>
                                        </div>
                                        <div className="flex space-x-1">
                                            <Button type="button" variant="outline" size="icon" onClick={() => handleEdit(item)}>
                                                <Edit className="size-2" />
                                            </Button>
                                            <Button type="button" variant="outline" size="icon" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="size-2" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
