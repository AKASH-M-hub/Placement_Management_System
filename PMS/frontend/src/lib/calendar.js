const pad = (value) => String(value).padStart(2, '0');

const formatDateOnly = (date) => `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;

const formatDateTimeUtc = (date) => `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

const escapeText = (value = '') => value
  .replace(/\\/g, '\\\\')
  .replace(/\n/g, '\\n')
  .replace(/,/g, '\\,')
  .replace(/;/g, '\\;');

const createIcsContent = ({ title, description, location, start, end, allDay = false }) => {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@pms`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//PMS//Placement Calendar//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatDateTimeUtc(new Date())}`,
    `SUMMARY:${escapeText(title)}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${escapeText(description)}`);
  }

  if (location) {
    lines.push(`LOCATION:${escapeText(location)}`);
  }

  if (allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(start)}`);
    lines.push(`DTEND;VALUE=DATE:${formatDateOnly(end)}`);
  } else {
    lines.push(`DTSTART:${formatDateTimeUtc(start)}`);
    lines.push(`DTEND:${formatDateTimeUtc(end)}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
};

export const downloadCalendarEvent = ({ fileName = 'event.ics', ...event }) => {
  const content = createIcsContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const toGoogleDate = (date) => `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;

export const buildGoogleCalendarUrl = ({ title, description, location, start, end, allDay = false }) => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description || '',
    location: location || '',
  });

  if (allDay) {
    params.set('dates', `${formatDateOnly(start)}/${formatDateOnly(end)}`);
  } else {
    params.set('dates', `${toGoogleDate(start)}/${toGoogleDate(end)}`);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const buildInterviewCalendarEvent = (interview) => {
  const start = new Date(interview.scheduledAt);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const jobTitle = interview.application?.job?.title || 'Interview';
  const descriptionParts = [
    interview.remarks || '',
    interview.meetingLink ? `Meeting link: ${interview.meetingLink}` : '',
  ].filter(Boolean);

  return {
    title: `${jobTitle} Interview`,
    description: descriptionParts.join('\n'),
    location: interview.mode === 'ONLINE' ? interview.meetingLink || 'Online interview' : interview.mode || 'Interview venue',
    start,
    end,
    allDay: false,
    fileName: `${jobTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-interview.ics`,
  };
};

export const buildDeadlineCalendarEvent = (application) => {
  const deadlineValue = application.job?.deadlineDate || application.deadlineDate;
  const start = new Date(`${deadlineValue}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const jobTitle = application.job?.title || 'Application Deadline';

  return {
    title: `${jobTitle} Deadline`,
    description: application.reviewOpinion ? `Your review opinion: ${application.reviewOpinion}` : 'Placement application deadline',
    location: application.job?.registrationLink || '',
    start,
    end,
    allDay: true,
    fileName: `${jobTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-deadline.ics`,
  };
};