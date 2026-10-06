/**
 * 日程邮箱事件显示过滤（#27 课表重复）—— 回声抑制与显示开关。
 *
 * 事故：绑定清华邮箱日历后，课表里每节课出现两块；删掉邮箱里那条，重复消失。
 * 根因：早期「课表上云」写进邮箱的课表镜像（uid onethu-course-*）被同步拉回，
 * 而日程网格 / 系统日历把邮箱事件与教务课表无条件并集。
 *
 * [1] 镜像识别：来源标记命中，老数据按 uid 兜底
 * [2] 不得误伤：用户手建云日程（manual）与其他设备写入的日程
 * [3] 显示开关：关闭时邮箱日程整体隐藏，本机手动日程不受影响
 *
 * 跑法：node --import ./tools/ts-resolve-register.mjs tools/schedule-cloud-echo-test.mjs
 */
import assert from "node:assert/strict";

const { isOwnMirror, visibleCloudEvents } = await import("../apps/desktop/src/state/calDisplay.ts");

/* 样本取自各真实写入路径：buildSemesterEvents / 事件编辑器 / 插件门面 */
const course = { uid: "onethu-course-1a2b3c@onethu", onethuSource: "course" };
const exam = { uid: "onethu-exam-9z8y@onethu", onethuSource: "exam" };
const hw = { uid: "onethu-homework-aa11@onethu", onethuSource: "homework" };
const legacy = { uid: "onethu-course-1a2b3c@onethu" }; // 早期写入：无 X-ONETHU-SRC
const manual = { uid: "onethu-lm3k9xab12@onethu", onethuSource: "manual" }; // 用户手建云日程
const other = { uid: "8f21-other-device@example.com", summary: "组会" }; // 其他设备写入
const lookalike = { uid: "onethu-coursework-1@onethu" }; // 前缀相似，非镜像

assert.equal(isOwnMirror(course), true, "课程镜像必须识别");
assert.equal(isOwnMirror(exam), true, "考试镜像必须识别");
assert.equal(isOwnMirror(hw), true, "作业 DDL 镜像必须识别");
assert.equal(isOwnMirror(legacy), true, "老数据（无来源标记）按 uid 兜底识别");
assert.equal(isOwnMirror(manual), false, "用户手建云日程不得被过滤");
assert.equal(isOwnMirror(other), false, "其他设备写入的日程不得被过滤");
assert.equal(isOwnMirror(lookalike), false, "仅前缀相似的不是镜像");
assert.equal(isOwnMirror({}), false, "空事件不得抛错");

const all = [course, exam, hw, legacy, manual, other];
assert.deepEqual(visibleCloudEvents(all, true), [manual, other], "开关开：剔除全部镜像、保留其余");
assert.deepEqual(visibleCloudEvents(all, false), [], "开关关：邮箱日程整体隐藏");
assert.equal(all.length, 6, "纯函数不得改动入参数组");
assert.deepEqual(visibleCloudEvents([], true), [], "空列表安全");

console.log("✓ 日程邮箱事件过滤：12 项通过");
