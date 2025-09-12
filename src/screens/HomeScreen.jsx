// src/screens/HomeScreen.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
  ActivityIndicator,
  PanResponder,
  Animated,
  Pressable,
  Dimensions,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Header from '../components/Header';
import EventModal from '../components/EventModal';
import DraggableEventChip from '../components/DraggableEventChip';
import GoogleCalendarService from '../services/GoogleCalendarService';

// Get device dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isSmallScreen = screenWidth < 375;

// Responsive dimension functions
const wp = (percentage) => (screenWidth * percentage) / 100;
const hp = (percentage) => (screenHeight * percentage) / 100;

const HomeScreen = ({ navigation }) => {
  const [selected, setSelected] = useState('');
  const [events, setEvents] = useState({});
  const [markedDates, setMarkedDates] = useState({});
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState('');
  const [eventToEdit, setEventToEdit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);
  const [loadedYears, setLoadedYears] = useState(new Set());

  // Calendar permission state
  const [hasCalendarPermission, setHasCalendarPermission] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);

  // Drag and drop state
  const [draggingEvent, setDraggingEvent] = useState(null);
  const [draggingPosition] = useState(new Animated.ValueXY({ x: 0, y: 0 }));
  const dayLayouts = useRef({});

  // Request calendar permissions
  const requestCalendarPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const permissions = [
          PermissionsAndroid.PERMISSIONS.READ_CALENDAR,
          PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR,
        ];

        const granted = await PermissionsAndroid.requestMultiple(permissions);
        
        const readGranted = granted[PermissionsAndroid.PERMISSIONS.READ_CALENDAR] === PermissionsAndroid.RESULTS.GRANTED;
        const writeGranted = granted[PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR] === PermissionsAndroid.RESULTS.GRANTED;
        
        if (readGranted && writeGranted) {
          setHasCalendarPermission(true);
          console.log('Calendar permissions granted');
        } else {
          setHasCalendarPermission(false);
          Alert.alert(
            'Calendar Permission Required',
            'This app needs calendar access to manage your events. You can grant permissions in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => console.log('Open Settings') }
            ]
          );
        }
      } catch (err) {
        console.warn('Error requesting calendar permissions:', err);
        setHasCalendarPermission(false);
      } finally {
        setPermissionRequested(true);
      }
    } else {
      // iOS permissions would be handled differently
      setHasCalendarPermission(true);
      setPermissionRequested(true);
    }
  };

  // Check if permissions are already granted
  const checkCalendarPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const readPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CALENDAR);
        const writePermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_CALENDAR);
        
        if (readPermission && writePermission) {
          setHasCalendarPermission(true);
          setPermissionRequested(true);
        } else {
          // Request permissions if not granted
          await requestCalendarPermissions();
        }
      } catch (err) {
        console.warn('Error checking calendar permissions:', err);
        await requestCalendarPermissions();
      }
    } else {
      setHasCalendarPermission(true);
      setPermissionRequested(true);
    }
  };

  // Helper function to get event date
  const getEventDate = (event) => {
    if (event.startDateTime) {
      return event.startDateTime.split('T')[0];
    } else if (event.start?.dateTime) {
      return event.start.dateTime.split('T')[0];
    } else if (event.start?.date) {
      return event.start.date;
    }
    return null;
  };

  // PanResponder for drag/drop
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => !!draggingEvent,
    onPanResponderMove: (_, gesture) => {
      if (draggingEvent) {
        draggingPosition.setValue({
          x: gesture.moveX - 50,
          y: gesture.moveY - 20,
        });
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (!draggingEvent) return;

      let dropDate = null;

      for (const [date, layout] of Object.entries(dayLayouts.current)) {
        if (
          gesture.moveX >= layout.x &&
          gesture.moveX <= layout.x + layout.width &&
          gesture.moveY >= layout.y &&
          gesture.moveY <= layout.y + layout.height
        ) {
          dropDate = date;
          break;
        }
      }

      if (dropDate && dropDate !== getEventDate(draggingEvent)) {
        moveEventToDate(draggingEvent, dropDate);
      }

      setDraggingEvent(null);
    },
  });

  // Function to move event to new date
  const moveEventToDate = async (event, newDate) => {
    try {
      setLoading(true);

      let updatedEventData = {
        title: event.title,
        description: event.description || '',
        location: event.location || '',
      };

      if (event.startDateTime) {
        // For timed events, keep the same time but change the date
        const originalDateTime = new Date(event.startDateTime);
        const hours = originalDateTime.getHours();
        const minutes = originalDateTime.getMinutes();
        const seconds = originalDateTime.getSeconds();

        const newDateTime = new Date(newDate);
        newDateTime.setHours(hours, minutes, seconds, 0);

        updatedEventData.startDateTime = newDateTime.toISOString();

        if (event.endDateTime) {
          const originalEndDate = new Date(event.endDateTime);
          const duration = originalEndDate.getTime() - originalDateTime.getTime();
          const newEndDateTime = new Date(newDateTime.getTime() + duration);
          updatedEventData.endDateTime = newEndDateTime.toISOString();
        }
      } else {
        // For all-day events
        updatedEventData.startDateTime = new Date(newDate).toISOString();
        updatedEventData.endDateTime = new Date(newDate).toISOString();
        updatedEventData.isAllDay = true;
      }

      console.log('Updating event with data:', updatedEventData);

      // Update the local state immediately for better UX
      const updatedEvents = { ...events };
      const oldDate = getEventDate(event);
      
      // Remove from old date
      if (updatedEvents[oldDate]) {
        updatedEvents[oldDate] = updatedEvents[oldDate].filter(e => e.id !== event.id);
        if (updatedEvents[oldDate].length === 0) {
          delete updatedEvents[oldDate];
        }
      }
      
      // Add to new date
      if (!updatedEvents[newDate]) {
        updatedEvents[newDate] = [];
      }
      updatedEvents[newDate].push({ ...event, ...updatedEventData });
      
      setEvents(updatedEvents);

      // Call your Google Calendar API to update the event
      await GoogleCalendarService.updateEvent(event.id, updatedEventData);

      // Refresh events after successful update
      await loadCalendarData();

      const targetDateFormatted = new Date(newDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      Alert.alert('Success', `Event "${event.title}" moved to ${targetDateFormatted}!`);
    } catch (error) {
      console.error('Error moving event:', error);
      Alert.alert('Error', 'Failed to move event. Please try again.');
      // Refresh to restore original state on error
      await loadCalendarData();
    } finally {
      setLoading(false);
    }
  };

  // Handle event long press for dragging
  const handleEventLongPress = (event, dateString, nativeEvent) => {
    // Check if event can be moved
    const isGoogleEvent = event.creator && event.creator.includes('holiday');
    if (isGoogleEvent) {
      Alert.alert('Cannot Move Event', 'Holiday events cannot be moved.');
      return;
    }

    console.log('Started dragging event:', event.title);
    setDraggingEvent(event);

    // Set initial position based on touch location
    draggingPosition.setValue({
      x: nativeEvent.pageX - 50,
      y: nativeEvent.pageY - 20,
    });
  };

  // Custom Day Component with drag-and-drop support
  const CustomDay = ({ date, marking, onPress }) => {
    const dayEvents = events[date.dateString] || [];
    const isSelected = marking && marking.selected;
    const isToday = date.dateString === new Date().toISOString().split('T')[0];
    const isDragging = !!draggingEvent;
    const isDropZone = isDragging && date.dateString !== getEventDate(draggingEvent);
    
    const handleDayPress = () => {
      if (isDragging) {
        // If we're in drag mode, don't navigate
        return;
      }
      
      if (onPress) {
        onPress(date);
      }
      // Just select the date, don't open modal
      setSelected(date.dateString);
    };
    
    return (
      <Pressable
        style={[
          styles.dayContainer,
          isSelected && styles.selectedDay,
          isDropZone && styles.dropZone,
        ]}
        onPress={handleDayPress}
        ref={(ref) => {
          if (ref) {
            ref?.measureInWindow((x, y, width, height) => {
              dayLayouts.current[date.dateString] = {
                x,
                y,
                width,
                height,
              };
            });
          }
        }}
      >
        <View style={styles.dayContent}>
          <Text style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
            isToday && !isSelected && styles.todayText,
          ]}>
            {date.day}
          </Text>
          
          {/* Events under date */}
          <View style={styles.eventsUnderDate}>
            {dayEvents.slice(0, 3).map((event, index) => {
              const isDraggedEvent = isDragging && draggingEvent?.id === event.id;
              
              return (
                <DraggableEventChip
                  key={`${event.id}-${index}`}
                  event={event}
                  dateString={date.dateString}
                  onLongPress={handleEventLongPress}
                  onPress={handleEditEvent}
                  isDragging={isDragging}
                  isDraggedEvent={isDraggedEvent}
                />
              );
            })}
            {dayEvents.length > 3 && (
              <Text style={styles.moreEventsText}>+{dayEvents.length - 3}</Text>
            )}
          </View>

          {isDropZone && (
            <View style={styles.dropIndicator}>
              <Text style={styles.dropIndicatorText}>Drop Here</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  // Check calendar permissions on component mount
  useEffect(() => {
    checkCalendarPermissions();
  }, []);

  useEffect(() => {
    // Only load calendar data if permissions are granted
    if (hasCalendarPermission && permissionRequested) {
      loadCalendarData();
    }
  }, [hasCalendarPermission, permissionRequested]);

  useEffect(() => {
    if (selected && events[selected]) {
      setSelectedDateEvents(events[selected]);
    } else {
      setSelectedDateEvents([]);
    }
  }, [selected, events]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const currentYear = new Date().getFullYear();
      
      // Fetch events for the entire current year and next year
      const startDate = new Date(currentYear, 0, 1);
      const endDate = new Date(currentYear + 1, 11, 31);

      // Fetch user events and holidays
      const [userEvents, holidays] = await Promise.all([
        GoogleCalendarService.getEvents(startDate.toISOString(), endDate.toISOString()),
        GoogleCalendarService.getHolidays(startDate.toISOString(), endDate.toISOString())
      ]);

      // Combine and process events
      const allEvents = [...userEvents, ...holidays];
      const groupedEvents = GoogleCalendarService.groupEventsByDate(allEvents);
      const marked = createMarkedDates(groupedEvents);

      setEvents(groupedEvents);
      setMarkedDates(marked);
      setLoadedYears(new Set([currentYear, currentYear + 1]));
      
      // Set today as selected if no date is selected
      if (!selected) {
        const today = new Date().toISOString().split('T')[0];
        setSelected(today);
      }
    } catch (error) {
      console.error('Error loading calendar data:', error);
      Alert.alert('Error', 'Failed to load calendar data. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  const loadAdditionalYear = async (year) => {
    if (loadedYears.has(year)) {
      return;
    }

    try {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      const [userEvents, holidays] = await Promise.all([
        GoogleCalendarService.getEvents(startDate.toISOString(), endDate.toISOString()),
        GoogleCalendarService.getHolidays(startDate.toISOString(), endDate.toISOString())
      ]);

      const allEvents = [...userEvents, ...holidays];
      const groupedEvents = GoogleCalendarService.groupEventsByDate(allEvents);
      
      setEvents(prevEvents => ({ ...prevEvents, ...groupedEvents }));
      
      const newMarked = createMarkedDates({ ...events, ...groupedEvents });
      setMarkedDates(newMarked);
      
      setLoadedYears(prev => new Set([...prev, year]));
    } catch (error) {
      console.error(`Error loading data for year ${year}:`, error);
    }
  };

  const onMonthChange = (month) => {
    const year = new Date(month.dateString).getFullYear();
    
    if (!loadedYears.has(year)) {
      loadAdditionalYear(year);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCalendarData();
    setRefreshing(false);
  }, []);

  const createMarkedDates = (eventsData) => {
    const marked = {};
    
    Object.keys(eventsData).forEach(date => {
      marked[date] = {
        marked: true,
      };
    });

    if (selected) {
      marked[selected] = {
        ...marked[selected],
        selected: true,
      };
    }

    return marked;
  };

  const handleDayPress = (day) => {
    setSelected(day.dateString);
    const updatedMarked = { ...markedDates };
    
    Object.keys(updatedMarked).forEach(date => {
      if (updatedMarked[date].selected) {
        const { selected, ...rest } = updatedMarked[date];
        updatedMarked[date] = rest;
      }
    });
    
    updatedMarked[day.dateString] = {
      ...updatedMarked[day.dateString],
      selected: true,
    };
    
    setMarkedDates(updatedMarked);
  };

  const handleAddEvent = () => {
    setEventToEdit(null);
    setSelectedDateForModal(selected || new Date().toISOString().split('T')[0]);
    setShowEventModal(true);
  };

  const handleEditEvent = (event) => {
    const isGoogleEvent = event.creator && event.creator.includes('holiday');
    if (isGoogleEvent) {
      Alert.alert('Cannot Edit Event', 'Holiday events cannot be edited.');
      return;
    }
    
    setEventToEdit(event);
    setShowEventModal(true);
  };

  const handleEventSaved = () => {
    loadCalendarData();
  };

  const formatEventTime = (startDateTime, endDateTime, isAllDay) => {
    if (isAllDay) return 'All day';
    
    const start = new Date(startDateTime);
    const end = new Date(endDateTime);
    
    const formatTime = (date) => {
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    };
    
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  const renderEventItem = (event, index) => {
    const isDraggedEvent = draggingEvent && draggingEvent.id === event.id;
    
    return (
      <DraggableEventChip
        key={`${event.id}-${index}`}
        event={event}
        dateString={selected}
        onLongPress={handleEventLongPress}
        onPress={handleEditEvent}
        isDragging={!!draggingEvent}
        isDraggedEvent={isDraggedEvent}
        maxLines={2}
        showFullDetails={true}
        showEditIcon={true}
        style={{
          width: '100%',
          minHeight: 60,
          marginBottom: 12,
        }}
      />
    );
  };

  // Show permission request screen if permissions not granted
  if (!hasCalendarPermission && permissionRequested) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.permissionContainer}>
          <MaterialIcons name="event" size={80} color="#A16A4D" />
          <Text style={styles.permissionTitle}>Calendar Access Required</Text>
          <Text style={styles.permissionDescription}>
            This app needs access to your calendar to display and manage events. 
            Please grant calendar permissions to continue.
          </Text>
          <TouchableOpacity 
            style={styles.permissionButton} 
            onPress={requestCalendarPermissions}
          >
            <Text style={styles.permissionButtonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#A16A4D" />
          <Text style={styles.loadingText}>Loading your calendar...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Header />
      
      {/* Drag notification bar */}
      {draggingEvent && (
        <View style={styles.dragNotification}>
          <Text style={styles.dragNotificationText}>
            Moving "{draggingEvent?.title}" - Drop on any date to move
          </Text>
          <Pressable
            style={styles.cancelButton}
            onPress={() => setDraggingEvent(null)}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      )}
      
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={!draggingEvent}
      >
        {/* Calendar Section */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={handleDayPress}
            onMonthChange={onMonthChange}
            markedDates={markedDates}
            dayComponent={CustomDay}
            theme={{
              backgroundColor: '#0F0518',
              calendarBackground: '#0F0518',
              textSectionTitleColor: '#ffffff',
              selectedDayBackgroundColor: '#A16A4D',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#A16A4D',
              dayTextColor: '#ffffff',
              textDisabledColor: '#3B373E',
              dotColor: '#A16A4D',
              selectedDotColor: '#ffffff',
              arrowColor: '#A16A4D',
              disabledArrowColor: '#3B373E',
              monthTextColor: '#ffffff',
              indicatorColor: '#A16A4D',
              textDayFontFamily: 'System',
              textMonthFontFamily: 'System',
              textDayHeaderFontFamily: 'System',
              textDayFontWeight: '400',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
              textMonthFontSize: isTablet ? 22 : isSmallScreen ? 16 : 18,
              textDayHeaderFontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
            }}
            style={styles.calendar}
            hideExtraDays={false}
            showWeekNumbers={false}
            disableMonthChange={false}
            firstDay={1}
            hideDayNames={false}
            showSixWeeks={false}
            enableSwipeMonths={!draggingEvent}
          />
        </View>

        {/* Selected Date Events Section */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.eventsSectionTitle}>
              {selected ? 
                `Events : ${new Date(selected).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short'
                })} ${selectedDateEvents.length} ${selectedDateEvents.length === 1 ? 'event' : 'events'}` : 
                'Select a date to view events'
              }
            </Text>
          </View>
          
          {selectedDateEvents.length > 0 ? (
            <View style={styles.eventsContainer}>
              {selectedDateEvents.map(renderEventItem)}
            </View>
          ) : (
            <View style={styles.noEventsContainer}>
              <MaterialIcons name="event-available" size={48} color="#ccc" />
              <Text style={styles.noEventsText}>No events for this date</Text>
              <Text style={styles.noEventsSubText}>
                {!draggingEvent ? 'Tap + to add an event' : 'Long press events to move them'}
              </Text>
            </View>
          )}
        </View>

        {/* Legend */}
        {!draggingEvent && (
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.legendText}>Holiday Events</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2196F3' }]} />
              <Text style={styles.legendText}>Personal Events</Text>
            </View>
            <View style={styles.legendItem}>
              <Text style={styles.legendHint}>Long press events to move them</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {!draggingEvent && (
        <TouchableOpacity style={styles.fab} onPress={handleAddEvent}>
          <MaterialIcons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>
      )}

      {/* Floating dragged event */}
      {draggingEvent && (
        <Animated.View
          style={[
            styles.floatingEvent,
            {
              transform: [
                { translateX: draggingPosition.x },
                { translateY: draggingPosition.y },
              ],
            },
          ]}
        >
          <Text style={styles.floatingEventText}>{draggingEvent.title}</Text>
        </Animated.View>
      )}

      {/* Event Modal */}
      <EventModal
        visible={showEventModal}
        onClose={() => setShowEventModal(false)}
        selectedDate={selectedDateForModal}
        eventToEdit={eventToEdit}
        onEventSaved={handleEventSaved}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0518',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F0518',
  },
  loadingText: {
    marginTop: hp(1.5),
    fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
    color: '#ffffff',
  },

  // Calendar section
  calendarContainer: {
    backgroundColor: '#1B1024',
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    marginHorizontal: wp(4),
    marginTop: hp(2),
    borderRadius: wp(4),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  calendar: {
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: '#1B1024',
  },

  // Custom day styles
  dayContainer: {
    width: isTablet ? wp(8) : wp(10),
    height: isTablet ? hp(12) : hp(10),
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: hp(0.5),
    borderRadius: wp(1.5),
  },
  selectedDay: {
    backgroundColor: '#A16A4D',
    borderRadius: wp(2),
  },
  dayContent: {
    alignItems: 'center',
    flex: 1,
  },
  dayText: {
    fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
    color: '#ffffff',
    fontWeight: '400',
  },
  selectedDayText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  todayText: {
    color: '#A16A4D',
    fontWeight: 'bold',
  },
  eventsUnderDate: {
    marginTop: hp(0.3),
    alignItems: 'center',
    width: '100%',
  },
  moreEventsText: {
    fontSize: isTablet ? 10 : 8,
    color: '#666',
    marginTop: hp(0.1),
  },

  // Event chips (inside calendar cells)
  eventChip: {
    paddingHorizontal: wp(1),
    paddingVertical: hp(0.1),
    borderRadius: wp(1),
    marginVertical: hp(0.1),
    minHeight: isTablet ? hp(2) : hp(1.5),
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
  },
  eventChipText: {
    fontSize: isTablet ? 10 : isSmallScreen ? 7 : 8,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // Drop zone styling
  dropZone: {
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  dropIndicator: {
    position: 'absolute',
    bottom: hp(0.3),
    alignSelf: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: wp(1),
    paddingVertical: hp(0.1),
    borderRadius: wp(0.8),
  },
  dropIndicatorText: {
    fontSize: isTablet ? 8 : 6,
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // Floating dragged event
  floatingEvent: {
    position: 'absolute',
    backgroundColor: '#333',
    padding: wp(2),
    borderRadius: wp(1.5),
    zIndex: 1000,
    borderWidth: 2,
    borderColor: '#FF6B35',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  floatingEventText: {
    color: '#ffffff',
    fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
    fontWeight: 'bold',
  },

  // Drag notification bar
  dragNotification: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    marginHorizontal: wp(4),
    marginTop: hp(1.3),
    borderRadius: wp(2),
  },
  dragNotificationText: {
    color: '#ffffff',
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    flex: 1,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: wp(1.5),
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
    fontWeight: 'bold',
  },

  // Events section
  eventsSection: {
    margin: wp(4),
    backgroundColor: '#1B1024',
    borderRadius: wp(4),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    marginBottom: hp(12),
  },
  eventsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: wp(5),
    borderBottomWidth: 1,
    borderBottomColor: '#3B373E',
  },
  eventsSectionTitle: {
    fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  eventsContainer: {
    padding: wp(4),
  },

  // Event items
  eventItem: {
    borderRadius: wp(3),
    padding: wp(4),
    marginBottom: hp(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.5),
  },
  eventTitle: {
    fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: wp(2.5),
  },
  eventTime: {
    fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
    color: '#ffffff',
    opacity: 0.9,
  },
  eventLocation: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: hp(0.5),
  },
  eventDescription: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: '#ffffff',
    opacity: 0.8,
    lineHeight: isTablet ? 22 : 18,
    marginBottom: hp(1),
  },
  editIcon: {
    marginLeft: wp(2.5),
    opacity: 0.8,
  },

  // No events
  noEventsContainer: {
    alignItems: 'center',
    paddingVertical: hp(5),
  },
  noEventsText: {
    fontSize: isTablet ? 20 : isSmallScreen ? 16 : 18,
    color: '#3B373E',
    marginTop: hp(1.3),
  },
  noEventsSubText: {
    fontSize: isTablet ? 16 : isSmallScreen ? 12 : 14,
    color: '#3B373E',
    marginTop: hp(0.6),
  },

  // Legend
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    gap: wp(4),
    flexWrap: 'wrap',
    marginHorizontal: wp(4),
    backgroundColor: '#1B1024',
    borderRadius: wp(2.5),
    marginBottom: hp(2.5),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  legendDot: {
    width: isTablet ? wp(3) : wp(3.5),
    height: isTablet ? wp(3) : wp(3.5),
    borderRadius: isTablet ? wp(1.5) : wp(1.75),
    marginRight: wp(1.5),
  },
  legendText: {
    fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
    color: '#ffffff',
  },
  legendHint: {
    fontSize: isTablet ? 14 : isSmallScreen ? 10 : 12,
    color: '#3B373E',
    fontStyle: 'italic',
  },

  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: hp(4),
    right: wp(8),
    backgroundColor: '#A16A4D',
    width: isTablet ? wp(15) : wp(14),
    height: isTablet ? wp(15) : wp(14),
    borderRadius: isTablet ? wp(7.5) : wp(7),
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
  },

  // Permission request styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
    backgroundColor: '#0F0518',
  },
  permissionTitle: {
    fontSize: isTablet ? 24 : isSmallScreen ? 18 : 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: hp(3),
    marginBottom: hp(2),
  },
  permissionDescription: {
    fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: isTablet ? 26 : 22,
    marginBottom: hp(4),
    opacity: 0.9,
  },
  permissionButton: {
    backgroundColor: '#A16A4D',
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: wp(3),
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
  },
  permissionButtonText: {
    fontSize: isTablet ? 18 : isSmallScreen ? 14 : 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default HomeScreen;