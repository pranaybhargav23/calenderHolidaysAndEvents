// src/services/GoogleCalendarService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

class GoogleCalendarService {
  constructor() {
    this.accessToken = null;
  }

  async getAccessToken() {
    if (!this.accessToken) {
      this.accessToken = await AsyncStorage.getItem('accessToken');
    }
    return this.accessToken;
  }

  async makeAPICall(endpoint, method = 'GET', body = null) {
    const token = await this.getAccessToken();
    if (!token) {
      throw new Error('No access token available');
    }

    const config = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${CALENDAR_API_BASE}${endpoint}`, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }

      // Check if response has content to parse
      const contentType = response.headers.get('content-type');
      const hasJsonContent = contentType && contentType.includes('application/json');
      
      // For DELETE requests or empty responses, return success indicator
      if (method === 'DELETE' || response.status === 204) {
        return { success: true };
      }
      
      // Only try to parse JSON if the response has JSON content
      if (hasJsonContent) {
        const text = await response.text();
        return text ? JSON.parse(text) : {};
      }
      
      return {};
    } catch (error) {
      console.error('API call error:', error);
      throw error;
    }
  }

  async getEvents(startDate, endDate, calendarId = 'primary') {
    try {
      const timeMin = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
      const timeMax = endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
      const response = await this.makeAPICall(endpoint);
      
      return response.items || [];
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  async getHolidays(startDate, endDate, countryCode = 'en.indian#holiday@group.v.calendar.google.com') {
    try {
      const timeMin = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
      const timeMax = endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const endpoint = `/calendars/${encodeURIComponent(countryCode)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
      const response = await this.makeAPICall(endpoint);
      
      return response.items || [];
    } catch (error) {
      console.error('Error fetching holidays:', error);
      // Don't throw error for holidays as it's not critical
      return [];
    }
  }

  async createEvent(eventData, calendarId = 'primary') {
    try {
      const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events`;
      const event = {
        summary: eventData.title,
        description: eventData.description || '',
        location: eventData.location || '',
        start: {
          dateTime: eventData.startDateTime,
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: eventData.endDateTime,
          timeZone: 'Asia/Kolkata',
        },
        reminders: {
          useDefault: true,
        },
      };

      const response = await this.makeAPICall(endpoint, 'POST', event);
      return response;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(eventId, eventData, calendarId = 'primary') {
    try {
      const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`;
      const event = {
        summary: eventData.title,
        description: eventData.description || '',
        location: eventData.location || '',
        start: {
          dateTime: eventData.startDateTime,
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: eventData.endDateTime,
          timeZone: 'Asia/Kolkata',
        },
        reminders: {
          useDefault: true,
        },
      };

      const response = await this.makeAPICall(endpoint, 'PUT', event);
      return response;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(eventId, calendarId = 'primary') {
    try {
      const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`;
      await this.makeAPICall(endpoint, 'DELETE');
      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  formatEventForDisplay(event) {
    const startTime = event.start?.dateTime || event.start?.date;
    const endTime = event.end?.dateTime || event.end?.date;
    
    return {
      id: event.id,
      title: event.summary || 'No Title',
      description: event.description || '',
      location: event.location || '',
      startDateTime: startTime,
      endDateTime: endTime,
      isAllDay: !event.start?.dateTime,
      color: event.colorId || '#2196F3',
      creator: event.creator?.email || '',
    };
  }

  groupEventsByDate(events) {
    const grouped = {};
    
    events.forEach(event => {
      const startDate = event.start?.dateTime || event.start?.date;
      if (startDate) {
        const dateKey = startDate.split('T')[0]; // Get YYYY-MM-DD format
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(this.formatEventForDisplay(event));
      }
    });
    
    return grouped;
  }
}

export default new GoogleCalendarService();