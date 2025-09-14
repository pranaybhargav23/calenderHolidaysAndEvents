// src/components/DraggableEventChip.jsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Vibration,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const DraggableEventChip = ({ 
  event, 
  dateString, 
  onLongPress, 
  onPress,
  isDragging, 
  isDraggedEvent,
  style,
  maxLines = 1,
  showEditIcon = false,
  showFullDetails = false 
}) => {
  const isGoogleEvent = event.creator && event.creator.includes('holiday');
  const canBeMoved = !isGoogleEvent && (!event.calendarId || event.calendarId === 'primary');
  
  const handleLongPress = (nativeEvent) => {
    if (!canBeMoved) {
      // Show feedback for non-moveable events
      Vibration.vibrate(50);
      return;
    }

    if (onLongPress) {
      Vibration.vibrate(100); // Haptic feedback
      onLongPress(event, dateString, nativeEvent);
    }
  };

  const handlePress = () => {
    if (isDragging) {
      // Don't handle press when in drag mode
      return;
    }
    
    if (onPress) {
      onPress(event);
    }
  };

  const handleEditPress = (e) => {
    // Stop event propagation to prevent drag logic
    e.stopPropagation();
    if (onPress) {
      onPress(event);
    }
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

  if (showFullDetails) {
    return (
      <Pressable
        onLongPress={(e) => handleLongPress(e.nativeEvent)}
        onPress={handlePress}
        delayLongPress={200}
        style={[
          styles.eventItemLarge,
          {
            backgroundColor: isGoogleEvent ? '#4CAF50' : '#2196F3',
            opacity: isDraggedEvent ? 0.3 : (canBeMoved ? 1 : 0.7),
            borderWidth: isDraggedEvent ? 2 : 0,
            borderColor: isDraggedEvent ? '#FF6B35' : 'transparent',
          },
          style
        ]}
      >
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {event.title || event.summary || 'Untitled'}
              {isGoogleEvent && ' 🎉'}
            </Text>
            <Text style={styles.eventTime}>
              {formatEventTime(event.startDateTime, event.endDateTime, event.isAllDay)}
            </Text>
          </View>
          
          {event.location && (
            <Text style={styles.eventLocation} numberOfLines={1}>
              📍 {event.location}
            </Text>
          )}
          
          {event.description && (
            <Text style={styles.eventDescription} numberOfLines={2}>
              {event.description}
            </Text>
          )}
        </View>
        
        {canBeMoved && showEditIcon && (
          <Pressable 
            onPress={handleEditPress}
            style={styles.editIconContainer}
            hitSlop={10}
          >
            <MaterialIcons name="edit" size={20} color="#ffffff" style={styles.editIcon} />
          </Pressable>
        )}
      </Pressable>
    );
  }

  return (
    <Pressable
      onLongPress={(e) => handleLongPress(e.nativeEvent)}
      onPress={handlePress}
      delayLongPress={200}
      style={[
        styles.eventChip,
        {
          backgroundColor: isGoogleEvent ? '#4CAF50' : '#2196F3',
          opacity: isDraggedEvent ? 0.3 : (canBeMoved ? 1 : 0.7),
          borderWidth: isDraggedEvent ? 2 : 0,
          borderColor: isDraggedEvent ? '#FF6B35' : 'transparent',
        },
        style
      ]}
    >
      <Text 
        style={[
          styles.eventText,
          !canBeMoved && styles.nonEditableEventText
        ]} 
        numberOfLines={maxLines}
      >
        {event.title || event.summary || 'Untitled'}
        {isGoogleEvent && ' 🎉'}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  eventChip: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginVertical: 1,
    minHeight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    position: 'relative',
  },
  eventText: {
    fontSize: 8,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  nonEditableEventText: {
    fontStyle: 'italic',
    opacity: 0.8,
  },
  // Large event item styles
  eventItemLarge: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
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
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 10,
  },
  eventTime: {
    fontSize: 12,
    color: '#ffffff',
    opacity: 0.9,
  },
  eventLocation: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
    lineHeight: 18,
    marginBottom: 8,
  },
  editIcon: {
    marginLeft: 10,
    opacity: 0.8,
  },
  editIconContainer: {
    padding: 5,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

export default DraggableEventChip;