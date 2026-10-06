/**
 * 日程显示过滤 —— 纯函数，零依赖（node 直跑，见 tools/schedule-cloud-echo-test.mjs）。
 *
 * 由来（#27「邮箱云同步导致课表重复」）：早期「课表上云」把本学期每堂课写成一个
 * VEVENT（uid `onethu-course-<sig>@onethu`、X-ONETHU-SRC=course，见 cloudCal
 * buildSemesterEvents）。2026-09-13 退役只拆了写入触发点，邮箱里既有的镜像仍会被
 * syncCloudCal 原样拉回；而日程网格与系统日历把「邮箱事件」与「教务课表」无条件
 * 并集渲染（Schedule.tsx 网格、systemCal buildPayload）→ 同一节课两块。
 *
 * 这里按「自家镜像」标识别除。红线：用户手建云日程 uid 形如
 * `onethu-<ts><rand>@onethu`、onethuSource="manual"（事件编辑器 / 插件门面），
 * 必须保留——所以 uid 兜底只匹配带连字符的 `onethu-(course|exam|homework)-`，
 * 不能放宽成裸 `onethu-` 前缀。
 */

/** OneTHU 自己写出去、界面上另有原生渲染的邮箱事件来源 */
const MIRROR_SOURCES: ReadonlySet<string> = new Set(["course", "exam", "homework"]);
/** uid 兜底：早期写入未带 X-ONETHU-SRC（该 uid 格式自首个云同步提交 d6369a3 起未变） */
const MIRROR_UID = /^onethu-(course|exam|homework)-/;

export interface CalEventIdentity {
  uid?: string;
  onethuSource?: string;
}

/** 是否 OneTHU 自家写入的镜像事件（纯函数可测） */
export function isOwnMirror(ev: CalEventIdentity): boolean {
  const src = ev.onethuSource;
  if (src !== undefined && MIRROR_SOURCES.has(src)) return true;
  return MIRROR_UID.test(ev.uid ?? "");
}

/**
 * 日程页 / 系统日历实际消费的邮箱事件：
 * - showMailboxEvents=false：邮箱日程整体不显示（本机手动日程不受影响）
 * - true：剔除自家镜像，保留其他设备 / 其他应用写入的日程
 */
export function visibleCloudEvents<T extends CalEventIdentity>(events: readonly T[], showMailboxEvents: boolean): T[] {
  if (!showMailboxEvents) return [];
  return events.filter((ev) => !isOwnMirror(ev));
}
