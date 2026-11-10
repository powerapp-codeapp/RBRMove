import { useState } from 'react';
import type { Issue } from '../../../types/dataverse.types';

interface UseFindingReorderProps {
  sortedIssues: Issue[];
  filteredIssues: Issue[];
  onReorderIssues: (newIssues: Issue[], isCrossPriority?: boolean, fromCrit?: string, toCrit?: string) => void;
}

export const useFindingReorder = ({
  sortedIssues,
  filteredIssues,
  onReorderIssues,
}: UseFindingReorderProps) => {
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [dragOverIssueId, setDragOverIssueId] = useState<string | null>(null);
  const [draggableCardId, setDraggableCardId] = useState<string | null>(null);

  const performReorder = (draggedId: string, targetId: string) => {
    const dragIdx = sortedIssues.findIndex((i) => i.id === draggedId);
    const targetIdx = sortedIssues.findIndex((i) => i.id === targetId);
    if (dragIdx === -1 || targetIdx === -1 || dragIdx === targetIdx) return;

    const currentItem = sortedIssues[dragIdx];
    const targetItem = sortedIssues[targetIdx];
    const isCurrentExcluded = Boolean(currentItem.isExcluded || currentItem.status === 'Excluded');
    const isTargetExcluded = Boolean(targetItem.isExcluded || targetItem.status === 'Excluded');
    if (isCurrentExcluded || isTargetExcluded) return;

    const isCrossPriority = currentItem.criticality !== targetItem.criticality;

    const updated = [...sortedIssues];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(targetIdx, 0, moved);

    const activePart = updated.filter((i) => !i.isExcluded && i.status !== 'Excluded');
    const excludedPart = updated.filter((i) => i.isExcluded || i.status === 'Excluded');
    const sequenced = [...activePart, ...excludedPart].map((item, idx) => ({
      ...item,
      reportRef: idx + 1,
      reportReference: idx + 1,
    }));

    onReorderIssues(sequenced, isCrossPriority, currentItem.criticality, targetItem.criticality);
  };

  const handleMoveIssueById = (issueId: string, direction: 'up' | 'down') => {
    const currentFilteredIdx = filteredIssues.findIndex((i) => i.id === issueId);
    if (currentFilteredIdx === -1) return;
    const targetFilteredIdx = direction === 'up' ? currentFilteredIdx - 1 : currentFilteredIdx + 1;
    if (targetFilteredIdx < 0 || targetFilteredIdx >= filteredIssues.length) return;

    const targetIssueId = filteredIssues[targetFilteredIdx].id;
    performReorder(issueId, targetIssueId);
  };

  const handleDragStart = (e: React.DragEvent, issueId: string) => {
    setDraggedIssueId(issueId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', issueId);
  };

  const handleDragOver = (e: React.DragEvent, issueId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIssueId !== issueId) {
      setDragOverIssueId(issueId);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, issueId: string) => {
    if (dragOverIssueId === issueId) {
      setDragOverIssueId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIssueId: string) => {
    e.preventDefault();
    if (!draggedIssueId || draggedIssueId === targetIssueId) {
      setDraggedIssueId(null);
      setDragOverIssueId(null);
      setDraggableCardId(null);
      return;
    }
    performReorder(draggedIssueId, targetIssueId);
    setDraggedIssueId(null);
    setDragOverIssueId(null);
    setDraggableCardId(null);
  };

  const handleDragEnd = () => {
    setDraggedIssueId(null);
    setDragOverIssueId(null);
    setDraggableCardId(null);
  };

  return {
    draggedIssueId,
    dragOverIssueId,
    draggableCardId,
    setDraggableCardId,
    handleMoveIssueById,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
};

export default useFindingReorder;

