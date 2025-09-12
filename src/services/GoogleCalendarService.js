// // src/services/GoogleCalendarService.js
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

// class GoogleCalendarService {
//   constructor() {
//     this.accessToken = null;
//   }

//   async getAccessToken() {
//     if (!this.accessToken) {
//       this.accessToken = await AsyncStorage.getItem('accessToken');
//     }
//     return this.accessToken;
//   }

//   async makeAPICall(endpoint, method = 'GET', body = null) {
//     const token = await this.getAccessToken();
//     if (!token) {
//       throw new Error('No access token available');
//     }

//     const config = {
//       method,
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json',
//       },
//     };

//     if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
//       config.body = JSON.stringify(body);
//     }

//     try {
//       const response = await fetch(`${CALENDAR_API_BASE}${endpoint}`, config);
      
//       if (!response.ok) {
//         const errorText = await response.text();
//         throw new Error(`API call failed: ${response.status} - ${errorText}`);
//       }

//       // Check if response has content to parse
//       const contentType = response.headers.get('content-type');
//       const hasJsonContent = contentType && contentType.includes('application/json');
      
//       // For DELETE requests or empty responses, return success indicator
//       if (method === 'DELETE' || response.status === 204) {
//         return { success: true };
//       }
      
//       // Only try to parse JSON if the response has JSON content
//       if (hasJsonContent) {
//         const text = await response.text();
//         return text ? JSON.parse(text) : {};
//       }
      
//       return {};
//     } catch (error) {
//       console.error('API call error:', error);
//       throw error;
//     }
//   }

//   async getEvents(startDate, endDate, calendarId = 'primary') {
//     try {
//       const timeMin = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
//       const timeMax = endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
//       const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
//       const response = await this.makeAPICall(endpoint);
      
//       return response.items || [];
//     } catch (error) {
//       console.error('Error fetching events:', error);
//       throw error;
//     }
//   }

//   async getHolidays(startDate, endDate, countryCode = 'en.indian#holiday@group.v.calendar.google.com') {
//     try {
//       const timeMin = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
//       const timeMax = endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      
//       const endpoint = `/calendars/${encodeURIComponent(countryCode)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
//       const response = await this.makeAPICall(endpoint);
      
//       return response.items || [];
//     } catch (error) {
//       console.error('Error fetching holidays:', error);
//       // Don't throw error for holidays as it's not critical
//       return [];
//     }
//   }

//   async createEvent(eventData, calendarId = 'primary') {
//     try {
//       const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events`;
//       const event = {
//         summary: eventData.title,
//         description: eventData.description || '',
//         location: eventData.location || '',
//         start: {
//           dateTime: eventData.startDateTime,
//           timeZone: 'Asia/Kolkata',
//         },
//         end: {
//           dateTime: eventData.endDateTime,
//           timeZone: 'Asia/Kolkata',
//         },
//         reminders: {
//           useDefault: true,
//         },
//       };

//       const response = await this.makeAPICall(endpoint, 'POST', event);
//       return response;
//     } catch (error) {
//       console.error('Error creating event:', error);
//       throw error;
//     }
//   }

//   async updateEvent(eventId, eventData, calendarId = 'primary') {
//     try {
//       const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`;
//       const event = {
//         summary: eventData.title,
//         description: eventData.description || '',
//         location: eventData.location || '',
//         start: {
//           dateTime: eventData.startDateTime,
//           timeZone: 'Asia/Kolkata',
//         },
//         end: {
//           dateTime: eventData.endDateTime,
//           timeZone: 'Asia/Kolkata',
//         },
//         reminders: {
//           useDefault: true,
//         },
//       };

//       const response = await this.makeAPICall(endpoint, 'PUT', event);
//       return response;
//     } catch (error) {
//       console.error('Error updating event:', error);
//       throw error;
//     }
//   }

//   async deleteEvent(eventId, calendarId = 'primary') {
//     try {
//       const endpoint = `/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`;
//       await this.makeAPICall(endpoint, 'DELETE');
//       return true;
//     } catch (error) {
//       console.error('Error deleting event:', error);
//       throw error;
//     }
//   }

//   formatEventForDisplay(event) {
//     const startTime = event.start?.dateTime || event.start?.date;
//     const endTime = event.end?.dateTime || event.end?.date;
    
//     return {
//       id: event.id,
//       title: event.summary || 'No Title',
//       description: event.description || '',
//       location: event.location || '',
//       startDateTime: startTime,
//       endDateTime: endTime,
//       isAllDay: !event.start?.dateTime,
//       color: event.colorId || '#2196F3',
//       creator: event.creator?.email || '',
//     };
//   }

//   groupEventsByDate(events) {
//     const grouped = {};
    
//     events.forEach(event => {
//       const startDate = event.start?.dateTime || event.start?.date;
//       if (startDate) {
//         const dateKey = startDate.split('T')[0]; // Get YYYY-MM-DD format
//         if (!grouped[dateKey]) {
//           grouped[dateKey] = [];
//         }
//         grouped[dateKey].push(this.formatEventForDisplay(event));
//       }
//     });
    
//     return grouped;
//   }
// }

// export default new GoogleCalendarService();

// src/services/GoogleCalendarService.js
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Alert } from 'react-native';

class GoogleCalendarService {
  static tokenPromise = null;
  static cachedToken = null;
  static tokenExpiry = null;

  static async getAccessToken() {
    try {
      // If there's already a token request in progress, wait for it
      if (this.tokenPromise) {
        return await this.tokenPromise;
      }

      // Check if we have a valid cached token
      if (this.cachedToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.cachedToken;
      }

      // Create a new token request
      this.tokenPromise = this._fetchNewToken();
      const token = await this.tokenPromise;
      this.tokenPromise = null;
      
      return token;
    } catch (error) {
      this.tokenPromise = null;
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  static async _fetchNewToken() {
    try {
      // Check if user is signed in
      const userInfo = await GoogleSignin.getCurrentUser();
      if (!userInfo) {
        await GoogleSignin.signIn();
      }
      
      const tokens = await GoogleSignin.getTokens();
      
      // Cache the token for 50 minutes (tokens typically expire in 1 hour)
      this.cachedToken = tokens.accessToken;
      this.tokenExpiry = Date.now() + (50 * 60 * 1000);
      
      return tokens.accessToken;
    } catch (error) {
      throw error;
    }
  }

  static async getEvents(startDate, endDate) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startDate}&timeMax=${endDate}&singleEvents=true&orderBy=startTime`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Clear cached token on authentication error
          this.clearTokenCache();
        }
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      return this.transformEvents(data.items || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      return [];
    }
  }

  static async getHolidays(startDate, endDate) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/en.indian%23holiday%40group.v.calendar.google.com/events?timeMin=${startDate}&timeMax=${endDate}&singleEvents=true&orderBy=startTime`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        console.log('Holidays calendar not accessible or not found');
        return [];
      }

      const data = await response.json();
      return this.transformEvents(data.items || [], true);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      return [];
    }
  }

  static async createEvent(eventData) {
    try {
      const accessToken = await this.getAccessToken();
      
      const event = {
        summary: eventData.title,
        description: eventData.description || '',
        location: eventData.location || '',
        start: eventData.isAllDay ? 
          { date: eventData.startDateTime.split('T')[0] } :
          { dateTime: eventData.startDateTime, timeZone: 'Asia/Kolkata' },
        end: eventData.isAllDay ?
          { date: eventData.endDateTime.split('T')[0] } :
          { dateTime: eventData.endDateTime, timeZone: 'Asia/Kolkata' },
      };

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  static async updateEvent(eventId, eventData) {
    try {
      const accessToken = await this.getAccessToken();
      
      const event = {
        summary: eventData.title,
        description: eventData.description || '',
        location: eventData.location || '',
        start: eventData.isAllDay ? 
          { date: eventData.startDateTime.split('T')[0] } :
          { dateTime: eventData.startDateTime, timeZone: 'Asia/Kolkata' },
        end: eventData.isAllDay ?
          { date: eventData.endDateTime.split('T')[0] } :
          { dateTime: eventData.endDateTime, timeZone: 'Asia/Kolkata' },
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  }

  static async deleteEvent(eventId) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      return true;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  static transformEvents(events, isHoliday = false) {
    return events.map(event => {
      const isAllDay = !event.start.dateTime;
      
      return {
        id: event.id,
        title: event.summary || 'No Title',
        description: event.description || '',
        location: event.location || '',
        startDateTime: event.start.dateTime || event.start.date,
        endDateTime: event.end.dateTime || event.end.date,
        isAllDay: isAllDay,
        creator: isHoliday ? 'holiday@google.com' : event.creator?.email || '',
        status: event.status || 'confirmed',
        htmlLink: event.htmlLink || '',
      };
    });
  }

  static groupEventsByDate(events) {
    const grouped = {};
    
    events.forEach(event => {
      const date = event.startDateTime.split('T')[0];
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      
      grouped[date].push(event);
    });

    // Sort events within each date by start time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        if (a.isAllDay && !b.isAllDay) return -1;
        if (!a.isAllDay && b.isAllDay) return 1;
        if (a.isAllDay && b.isAllDay) return a.title.localeCompare(b.title);
        return new Date(a.startDateTime) - new Date(b.startDateTime);
      });
    });

    return grouped;
  }

  static async signIn() {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      return userInfo;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  static async signOut() {
    try {
      await GoogleSignin.signOut();
      // Clear cached token when signing out
      this.cachedToken = null;
      this.tokenExpiry = null;
      this.tokenPromise = null;
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  static clearTokenCache() {
    this.cachedToken = null;
    this.tokenExpiry = null;
    this.tokenPromise = null;
  }

  static async getCurrentUser() {
    try {
      const currentUser = await GoogleSignin.getCurrentUser();
      return currentUser;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
}

export default GoogleCalendarService;