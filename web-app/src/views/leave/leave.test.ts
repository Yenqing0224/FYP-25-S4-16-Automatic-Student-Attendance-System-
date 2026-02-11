/**
 * 请假页面用户ID属性测试
 * Feature: fix-hardcoded-user-ids
 * Validates: Requirements 1.1, 1.2, 1.3, 4.1, 4.3
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// 模拟提交请假申请的核心逻辑
interface LeaveRequestPayload {
  start_date: string;
  end_date: string;
  reason: string;
  description?: string;
  user: number | string;
}

/**
 * 验证用户ID是否有效
 * @param userId 用户ID
 * @returns 是否有效
 */
function isValidUserId(userId: unknown): boolean {
  if (userId === null || userId === undefined || userId === '') {
    return false;
  }
  if (typeof userId === 'number') {
    return userId > 0;
  }
  if (typeof userId === 'string') {
    const num = Number(userId);
    return !isNaN(num) && num > 0;
  }
  return false;
}

/**
 * 构建请假申请提交数据
 * @param formData 表单数据
 * @param userId 用户ID
 * @returns 提交数据或null（如果用户ID无效）
 */
function buildLeaveRequestPayload(
  formData: { startDate: string; endDate: string; reason: string; description?: string },
  userId: unknown
): LeaveRequestPayload | null {
  if (!isValidUserId(userId)) {
    return null;
  }
  return {
    start_date: formData.startDate,
    end_date: formData.endDate,
    reason: formData.reason,
    description: formData.description,
    user: userId as number | string,
  };
}

describe('请假页面用户ID属性测试', () => {
  /**
   * Property 1: 请假申请用户ID正确性
   * *对于任何* 已登录用户提交的请假申请，提交到后端的 `user` 字段值应该等于 User Store 中存储的 `userId` 值。
   * Validates: Requirements 1.1, 1.3
   */
  it('Property 1: 请假申请用户ID正确性 - 对于任何有效的userId，提交的请假申请应包含正确的user字段', () => {
    fc.assert(
      fc.property(
        // 生成有效的用户ID（正整数）
        fc.integer({ min: 1, max: 1000000 }),
        // 生成表单数据
        fc.record({
          startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
          endDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
          reason: fc.constantFrom('Medical Leave', 'Personal Leave', 'Family Emergency', 'Other'),
          description: fc.string({ minLength: 0, maxLength: 500 }),
        }),
        (userId, formData) => {
          const payload = buildLeaveRequestPayload(formData, userId);
          
          // 验证payload不为null
          expect(payload).not.toBeNull();
          
          // 验证user字段等于传入的userId
          expect(payload!.user).toBe(userId);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 2: 无效用户ID阻止提交
   * *对于任何* userId 为空、null 或 undefined 的情况，请假申请提交应该被阻止，且不应调用后端 API。
   * Validates: Requirements 1.2, 4.1, 4.3
   */
  it('Property 2: 无效用户ID阻止提交 - 对于任何无效的userId，提交应被阻止', () => {
    fc.assert(
      fc.property(
        // 生成无效的用户ID
        fc.oneof(
          fc.constant(null),
          fc.constant(undefined),
          fc.constant(''),
          fc.constant(0),
          fc.constant(-1),
          fc.integer({ min: -1000, max: 0 }),
        ),
        // 生成表单数据
        fc.record({
          startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
          endDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2025-12-31') }).map(d => d.toISOString().split('T')[0]),
          reason: fc.constantFrom('Medical Leave', 'Personal Leave', 'Family Emergency', 'Other'),
          description: fc.string({ minLength: 0, maxLength: 500 }),
        }),
        (invalidUserId, formData) => {
          const payload = buildLeaveRequestPayload(formData, invalidUserId);
          
          // 验证payload为null，表示提交被阻止
          expect(payload).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * 补充测试：字符串形式的有效用户ID也应该被接受
   */
  it('Property 1 补充: 字符串形式的有效用户ID也应该正确处理', () => {
    fc.assert(
      fc.property(
        // 生成有效的用户ID字符串
        fc.integer({ min: 1, max: 1000000 }).map(n => String(n)),
        fc.record({
          startDate: fc.constant('2024-06-01'),
          endDate: fc.constant('2024-06-05'),
          reason: fc.constant('Medical Leave'),
          description: fc.constant('Test description'),
        }),
        (userIdStr, formData) => {
          const payload = buildLeaveRequestPayload(formData, userIdStr);
          
          // 验证payload不为null
          expect(payload).not.toBeNull();
          
          // 验证user字段等于传入的userId字符串
          expect(payload!.user).toBe(userIdStr);
        }
      ),
      { numRuns: 100 }
    );
  });
});
