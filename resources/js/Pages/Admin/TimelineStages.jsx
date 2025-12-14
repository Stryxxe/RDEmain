import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '../../Components/Layouts/AdminLayout';

export default function TimelineStages({ stages, statuses }) {
    const { flash } = usePage().props;
    const [editingStage, setEditingStage] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [localStages, setLocalStages] = useState(stages);
    const [formData, setFormData] = useState({
        stageName: '',
        stageDescription: '',
        orderIndex: stages.length + 1,
        statusID: '',
        isActive: true,
        color: 'blue'
    });

    const colors = ['gray', 'blue', 'green', 'red', 'yellow', 'purple', 'indigo', 'pink', 'orange', 'cyan'];

    const moveStage = (index, direction) => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= localStages.length) return;

        const items = Array.from(localStages);
        const [movedItem] = items.splice(index, 1);
        items.splice(newIndex, 0, movedItem);

        // Update order indices
        const updatedStages = items.map((stage, idx) => ({
            ...stage,
            orderIndex: idx + 1
        }));

        setLocalStages(updatedStages);

        // Send update to backend
        axios.post('/api/timeline-stages/update-order', {
            stages: updatedStages.map(s => ({
                stageID: s.stageID,
                orderIndex: s.orderIndex
            }))
        }).catch(error => {
            console.error('Failed to update order:', error);
            setLocalStages(stages); // Revert on error
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingStage) {
            router.put(`/admin/timeline-stages/${editingStage.stageID}`, formData, {
                onSuccess: () => {
                    setEditingStage(null);
                    resetForm();
                }
            });
        } else {
            router.post('/admin/timeline-stages', formData, {
                onSuccess: () => {
                    setShowAddModal(false);
                    resetForm();
                }
            });
        }
    };

    const handleEdit = (stage) => {
        setEditingStage(stage);
        setFormData({
            stageName: stage.stageName,
            stageDescription: stage.stageDescription || '',
            orderIndex: stage.orderIndex,
            statusID: stage.statusID || '',
            isActive: stage.isActive,
            color: stage.color || 'blue'
        });
    };

    const handleDelete = (stageID) => {
        if (confirm('Are you sure you want to delete this timeline stage?')) {
            router.delete(`/admin/timeline-stages/${stageID}`);
        }
    };

    const handleToggleActive = (stageID) => {
        axios.post(`/api/timeline-stages/${stageID}/toggle`)
            .then(() => router.reload())
            .catch(error => console.error('Failed to toggle:', error));
    };

    const resetForm = () => {
        setFormData({
            stageName: '',
            stageDescription: '',
            orderIndex: stages.length + 1,
            statusID: '',
            isActive: true,
            color: 'blue'
        });
    };

    return (
        <AdminLayout>
            <Head title="Timeline Stages Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Timeline Stages Management</h2>
                            <p className="mt-2 text-gray-600">Manage the project timeline stages displayed to users</p>
                        </div>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            + Add New Stage
                        </button>
                    </div>

                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                            {flash.error}
                        </div>
                    )}

                    {/* Stages List */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-semibold mb-4">Timeline Stages (Use arrows to reorder)</h3>
                        
                        <div className="space-y-2">
                            {localStages.map((stage, index) => (
                                <div key={stage.stageID} className="p-4 border rounded-lg bg-gray-50 border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            {/* Reorder Buttons */}
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={() => moveStage(index, 'up')}
                                                    disabled={index === 0}
                                                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Move up"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => moveStage(index, 'down')}
                                                    disabled={index === localStages.length - 1}
                                                    className="text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title="Move down"
                                                >
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                            
                                            <span className="font-mono text-sm text-gray-500 w-8">#{stage.orderIndex}</span>
                                            
                                            <div
                                                className={`w-4 h-4 rounded-full bg-${stage.color}-500`}
                                                title={stage.color}
                                            ></div>
                                            
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">{stage.stageName}</h4>
                                                <p className="text-sm text-gray-600">{stage.stageDescription}</p>
                                                {stage.status && (
                                                    <span className="inline-block mt-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                                        {stage.status.statusName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleToggleActive(stage.stageID)}
                                                className={`px-3 py-1 rounded text-xs font-medium ${
                                                    stage.isActive
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}
                                            >
                                                {stage.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(stage)}
                                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(stage.stageID)}
                                                className="px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add/Edit Modal */}
                    {(showAddModal || editingStage) && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                                <h3 className="text-xl font-bold mb-4">
                                    {editingStage ? 'Edit Timeline Stage' : 'Add New Timeline Stage'}
                                </h3>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Stage Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.stageName}
                                            onChange={(e) => setFormData({ ...formData, stageName: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            value={formData.stageDescription}
                                            onChange={(e) => setFormData({ ...formData, stageDescription: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Order Index *
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.orderIndex}
                                                onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                                required
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Associated Status
                                            </label>
                                            <select
                                                value={formData.statusID}
                                                onChange={(e) => setFormData({ ...formData, statusID: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                            >
                                                <option value="">None</option>
                                                {statuses.map(status => (
                                                    <option key={status.statusID} value={status.statusID}>
                                                        {status.statusName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Color
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {colors.map(color => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, color })}
                                                    className={`w-8 h-8 rounded-full bg-${color}-500 ${
                                                        formData.color === color ? 'ring-4 ring-offset-2 ring-red-500' : ''
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="rounded"
                                        />
                                        <label className="text-sm text-gray-700">Active (visible to users)</label>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddModal(false);
                                                setEditingStage(null);
                                                resetForm();
                                            }}
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                        >
                                            {editingStage ? 'Update' : 'Create'} Stage
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
