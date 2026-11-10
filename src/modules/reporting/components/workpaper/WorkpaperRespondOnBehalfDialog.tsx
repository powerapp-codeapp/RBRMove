import React, { useRef } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { SharedButton } from '../../../../components/shared/buttons/SharedButton';
import { SharedTextArea } from '../../../../components/shared/inputs/SharedTextArea';
import { SharedTextInput } from '../../../../components/shared/inputs/SharedTextInput';
import { SharedFieldLabel } from '../../../../components/shared/common/SharedFieldLabel';

export interface BizOnBehalfDraft {
  reason: string;
  response: string;
  attachment: string;
  targetDate?: string;
}

export interface BizOnBehalfErrors {
  reason?: string;
  response?: string;
  attachment?: string;
}

interface WorkpaperRespondOnBehalfDialogProps {
  isOpen: boolean;
  onClose: () => void;
  findingTitle: string;
  draft: BizOnBehalfDraft;
  errors: BizOnBehalfErrors;
  onChangeDraft: (updater: (prev: BizOnBehalfDraft) => BizOnBehalfDraft) => void;
  onClearError: (field: keyof BizOnBehalfErrors) => void;
  onSave: () => void;
}

export const WorkpaperRespondOnBehalfDialog: React.FC<WorkpaperRespondOnBehalfDialogProps> = ({
  isOpen,
  onClose,
  findingTitle,
  draft,
  errors,
  onChangeDraft,
  onClearError,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          maxWidth: '540px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.16)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #E2E8F0',
          padding: '20px 24px',
          gap: '16px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000099',
              flexShrink: 0,
            }}
          >
            <FileText style={{ width: '15px', height: '15px' }} />
          </div>
          <h3
            className="type-modal-title"
            style={{
              margin: 0,
              fontSize: 'var(--type-modal-title-size, 15px)',
              fontWeight: 700,
              color: '#0F172A',
              lineHeight: 1.35,
              wordBreak: 'break-word',
            }}
          >
            {findingTitle}
          </h3>
        </div>

        {/* 1. Reason */}
        <SharedTextArea
          label="Reason"
          required
          value={draft.reason}
          onChange={(val) => {
            onChangeDraft((prev) => ({ ...prev, reason: val }));
            if (errors.reason) onClearError('reason');
          }}
          rows={3}
          error={Boolean(errors.reason)}
          errorMessage={errors.reason}
        />

        {/* 2. Business Management Response */}
        <SharedTextArea
          label="Business Management Response"
          required
          value={draft.response}
          onChange={(val) => {
            onChangeDraft((prev) => ({ ...prev, response: val }));
            if (errors.response) onClearError('response');
          }}
          rows={4}
          error={Boolean(errors.response)}
          errorMessage={errors.response}
        />

        {/* 3. Agreed Remediation Target Date */}
        <SharedTextInput
          type="date"
          label="Agreed Remediation Target Date"
          value={draft.targetDate || ''}
          onChange={(val) => {
            onChangeDraft((prev) => ({ ...prev, targetDate: val }));
          }}
          placeholder="YYYY-MM-DD"
        />

        {/* 4. Attachment (Proof of Offline Conversation) */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <SharedFieldLabel>Attachment</SharedFieldLabel>

          <input
            ref={fileInputRef}
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onChangeDraft((prev) => ({ ...prev, attachment: file.name }));
                if (errors.attachment) onClearError('attachment');
              }
            }}
          />

          {draft.attachment ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000099',
                    flexShrink: 0,
                  }}
                >
                  <FileText size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#1E293B',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {draft.attachment}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onChangeDraft((prev) => ({ ...prev, attachment: '' }))}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#EF4444',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                }}
                title="Remove attachment"
              >
                <Trash2 size={14} />
                <span>Remove</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => {
                fileInputRef.current?.click();
              }}
              style={{
                border: errors.attachment
                  ? '1.5px dashed #DC2626'
                  : '1.5px dashed #CBD5E1',
                borderRadius: '6px',
                padding: '14px',
                textAlign: 'center',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'border-color 0.15s ease',
              }}
            >
              <div style={{ color: '#000099', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={16} />
                <span style={{ fontSize: '12.5px', fontWeight: 600 }}>
                  Click to upload the offline response
                </span>
              </div>
            </div>
          )}

          {errors.attachment && (
            <span style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: 500, marginTop: '4px' }}>
              {errors.attachment}
            </span>
          )}
        </div>

        {/* Dialog Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
          <SharedButton
            variant="secondary"
            size="small"
            onClick={onClose}
          >
            Cancel
          </SharedButton>
          <SharedButton
            variant="primary"
            size="small"
            onClick={onSave}
          >
            Submit Response
          </SharedButton>
        </div>
      </div>
    </div>
  );
};

