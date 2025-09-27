import { useState } from "react"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Save, X } from "lucide-react"

export interface Update {
    id: string
    date: string
    message: string
}
interface UpdateManagerProps {
    updates: Update[]
    onChange: (updates: Update[]) => void
}

export function UpdateManager({ updates, onChange }: UpdateManagerProps) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<Update>>({})

    const handleAdd = () => {
        const newUpdate: Update = {
            id: uuidv4(),
            date: new Date().toISOString(),
            message: "",
        }
        
        setEditingId(newUpdate.id)
        setEditForm(newUpdate)
        console.log(newUpdate)
        onChange([...updates, newUpdate])
    }

    const handleEdit = (update: Update) => {
        setEditingId(update.id)
        setEditForm(update)
    }

    const handleSave = () => {
        if (editingId && editForm.date && editForm.message) {
            const updatedUpdates = updates.map((update) =>
                update.id === editingId ? { ...update, date: editForm.date!, message: editForm.message! } : update,
            )
            onChange(updatedUpdates)
            setEditingId(null)
            setEditForm({})
        }
    }

    const handleCancel = () => {
        if (editForm.message === "" && editForm.date) {
            onChange(updates.filter((update) => update.id !== editingId))
        }
        setEditingId(null)
        setEditForm({})
    }

    const handleDelete = (id: string) => {
        onChange(updates.filter((update) => update.id !== id))
        if (editingId === id) {
            setEditingId(null)
            setEditForm({})
        }
    }

    return (
        <div className="space-y-4">
            <hr />
            <div className="flex items-center justify-between">
                <h4 className="font-medium">Project Updates</h4>
                <Button type="button" variant="default" size="sm" onClick={handleAdd}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Update
                </Button>
            </div>

            <div className="space-y-3">
                {updates.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                        No updates added yet. Click "Add Update" to create one.
                    </p>
                ) : (
                    updates.map((update) => (
                        <Card key={update.id} className="relative">
                            <CardContent className="pt-4">
                                {editingId === update.id ? (
                                    <div className="space-y-3">
                                        <div>
                                            {/* <Calendar buttonVariant={"outline"}  mode="single" selected={new Date()} /> */}
                                            <Input
                                                type="date"
                                                max={new Date().toISOString().split("T")[0]} // Prevent future dates
                                                value={editForm.date || ""}
                                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Textarea
                                                placeholder="Enter update message..."
                                                value={editForm.message || ""}
                                                onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                                                rows={2}
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <Button type="button" variant="outline" size="sm" onClick={handleCancel}>
                                                <X className="h-4 w-4 mr-1" />
                                                Cancel
                                            </Button>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={handleSave}
                                                disabled={!editForm.date || !editForm.message}
                                            >
                                                <Save className="h-4 w-4 mr-1" />
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {new Date(update.date).toLocaleDateString()}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-700">{update.message}</p>
                                        </div>
                                        <div className="flex space-x-1 ml-4">
                                            <Button type="button" variant="outline" size="icon" onClick={() => handleEdit(update)}>
                                                <Edit />
                                            </Button>
                                            <Button type="button" variant="outline" size="icon" onClick={() => handleDelete(update.id)}>
                                                <Trash2 />
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
