import { Badge } from '@/components/ui';
import { APPROVAL_LABEL, ENROLLMENT_LABEL, RESULT_LABEL, ROLE_LABEL } from '@/lib/format';
import type { ApprovalStatus, EnrollmentStatus, ResultStatus, Role } from '@/lib/types';

export function EnrollmentBadge({ status }: { status: EnrollmentStatus }) {
  const tone = status === 'อนุมัติ' ? 'green' : status === 'ปฏิเสธ' ? 'red' : 'amber';
  return (
    <Badge tone={tone} dot>
      {ENROLLMENT_LABEL[status] || status}
    </Badge>
  );
}

export function ResultBadge({ status }: { status: ResultStatus | null | undefined }) {
  const s = status || 'pending';
  const tone = s === 'passed' ? 'green' : s === 'failed' ? 'red' : 'neutral';
  return (
    <Badge tone={tone} dot>
      {RESULT_LABEL[s]}
    </Badge>
  );
}

export function ApprovalBadge({ status }: { status: ApprovalStatus | null | undefined }) {
  const s = status || 'none';
  const tone = s === 'approved' ? 'green' : s === 'submitted' ? 'blue' : s === 'rejected' ? 'red' : 'neutral';
  return (
    <Badge tone={tone} dot>
      {APPROVAL_LABEL[s]}
    </Badge>
  );
}

export function RoleBadge({ role }: { role: Role }) {
  const tone = role === 'admin' ? 'red' : role === 'director' ? 'violet' : role === 'evaluator' ? 'blue' : 'neutral';
  return <Badge tone={tone}>{ROLE_LABEL[role]}</Badge>;
}

export function PassFail({ passed }: { passed: boolean | null | undefined }) {
  if (passed === null || passed === undefined) return <Badge tone="neutral">รอผล</Badge>;
  return passed ? (
    <Badge tone="green" dot>
      ผ่าน
    </Badge>
  ) : (
    <Badge tone="red" dot>
      ไม่ผ่าน
    </Badge>
  );
}
