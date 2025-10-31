import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * 时区枚举
 */
const TimezoneEnum = z.enum([
  'UTC',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Australia/Sydney',
  'local'
]);

/**
 * 时间格式枚举
 */
const TimeFormatEnum = z.enum([
  'iso',           // ISO 8601 格式: 2024-01-15T10:30:45.123Z
  'timestamp',     // Unix 时间戳: 1705312245123
  'readable',      // 可读格式: 2024年1月15日 10:30:45
  'date-only',     // 仅日期: 2024-01-15
  'time-only',     // 仅时间: 10:30:45
  'custom'         // 自定义格式
]);

/**
 * 获取当前时间工具的输入Schema
 */
export const CurrentTimeInputSchema = z.object({
  timezone: TimezoneEnum.optional().default('local').describe('时区设置'),
  format: TimeFormatEnum.optional().default('iso').describe('时间格式'),
  customFormat: z.string().optional().describe('自定义时间格式 (当format为custom时使用)'),
  includeMilliseconds: z.boolean().optional().default(true).describe('是否包含毫秒'),
});

/**
 * 获取当前时间工具的输出Schema
 */
export const CurrentTimeOutputSchema = z.object({
  timestamp: z.number().describe('Unix时间戳'),
  iso: z.string().describe('ISO 8601格式时间'),
  formatted: z.string().describe('格式化后的时间字符串'),
  timezone: z.string().describe('使用的时区'),
  year: z.number().describe('年份'),
  month: z.number().describe('月份 (1-12)'),
  day: z.number().describe('日期'),
  hour: z.number().describe('小时 (0-23)'),
  minute: z.number().describe('分钟 (0-59)'),
  second: z.number().describe('秒 (0-59)'),
  millisecond: z.number().describe('毫秒 (0-999)'),
  dayOfWeek: z.string().describe('星期几'),
  isWeekend: z.boolean().describe('是否为周末'),
});

/**
 * 获取当前时间的工具
 */
export const currentTimeTool = createTool({
  id: 'get-current-time',
  description: '获取当前时间，支持多种时区和格式',
  inputSchema: CurrentTimeInputSchema,
  outputSchema: CurrentTimeOutputSchema,
  execute: async ({ context }) => {
    return getCurrentTime(context);
  },
});

/**
 * 获取当前时间的核心函数
 */
const getCurrentTime = (options: z.infer<typeof CurrentTimeInputSchema>) => {
  const {
    timezone = 'local',
    format = 'iso',
    customFormat,
    includeMilliseconds = true
  } = options;

  const now = new Date();
  
  // 处理时区
  let targetDate: Date;
  let timezoneString: string;
  
  if (timezone === 'local') {
    targetDate = now;
    timezoneString = Intl.DateTimeFormat().resolvedOptions().timeZone;
  } else {
    // 创建指定时区的时间
    const timeInTimezone = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(now);
    
    const year = parseInt(timeInTimezone.find(part => part.type === 'year')?.value || '0');
    const month = parseInt(timeInTimezone.find(part => part.type === 'month')?.value || '0') - 1;
    const day = parseInt(timeInTimezone.find(part => part.type === 'day')?.value || '0');
    const hour = parseInt(timeInTimezone.find(part => part.type === 'hour')?.value || '0');
    const minute = parseInt(timeInTimezone.find(part => part.type === 'minute')?.value || '0');
    const second = parseInt(timeInTimezone.find(part => part.type === 'second')?.value || '0');
    
    targetDate = new Date(year, month, day, hour, minute, second, now.getMilliseconds());
    timezoneString = timezone;
  }

  // 基础时间信息
  const timestamp = includeMilliseconds ? targetDate.getTime() : Math.floor(targetDate.getTime() / 1000) * 1000;
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth() + 1;
  const day = targetDate.getDate();
  const hour = targetDate.getHours();
  const minute = targetDate.getMinutes();
  const second = targetDate.getSeconds();
  const millisecond = targetDate.getMilliseconds();
  
  // 星期几
  const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const dayOfWeek = dayNames[targetDate.getDay()];
  const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;

  // ISO格式
  const iso = timezone === 'UTC' ? targetDate.toISOString() : 
    (timezone === 'local' ? targetDate.toISOString() : 
     new Date(targetDate.getTime() - targetDate.getTimezoneOffset() * 60000).toISOString());

  // 格式化时间字符串
  let formatted: string;
  
  switch (format) {
    case 'iso':
      formatted = iso;
      break;
    case 'timestamp':
      formatted = timestamp.toString();
      break;
    case 'readable':
      formatted = `${year}年${month}月${day}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
      if (includeMilliseconds) {
        formatted += `.${millisecond.toString().padStart(3, '0')}`;
      }
      break;
    case 'date-only':
      formatted = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      break;
    case 'time-only':
      formatted = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`;
      if (includeMilliseconds) {
        formatted += `.${millisecond.toString().padStart(3, '0')}`;
      }
      break;
    case 'custom':
      if (customFormat) {
        formatted = formatCustomTime(targetDate, customFormat);
      } else {
        formatted = iso; // 回退到ISO格式
      }
      break;
    default:
      formatted = iso;
  }

  return {
    timestamp,
    iso,
    formatted,
    timezone: timezoneString,
    year,
    month,
    day,
    hour,
    minute,
    second,
    millisecond,
    dayOfWeek,
    isWeekend,
  };
};

/**
 * 自定义时间格式化函数
 * 支持的占位符:
 * YYYY - 四位年份
 * MM - 两位月份
 * DD - 两位日期
 * HH - 两位小时
 * mm - 两位分钟
 * ss - 两位秒
 * SSS - 三位毫秒
 */
const formatCustomTime = (date: Date, format: string): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  const millisecond = date.getMilliseconds();

  return format
    .replace('YYYY', year.toString())
    .replace('MM', month.toString().padStart(2, '0'))
    .replace('DD', day.toString().padStart(2, '0'))
    .replace('HH', hour.toString().padStart(2, '0'))
    .replace('mm', minute.toString().padStart(2, '0'))
    .replace('ss', second.toString().padStart(2, '0'))
    .replace('SSS', millisecond.toString().padStart(3, '0'));
};

// 导出类型
export type CurrentTimeInput = z.infer<typeof CurrentTimeInputSchema>;
export type CurrentTimeOutput = z.infer<typeof CurrentTimeOutputSchema>;