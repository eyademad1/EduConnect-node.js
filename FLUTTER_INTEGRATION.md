# Flutter Integration Guide

This guide explains how to connect your Flutter app to the Node.js backend.

## Update Service URLs

Update the following service files in your Flutter app to point to the backend server:

### 1. Update AuthService

In `lib/services/auth_service.dart`, update the `baseUrl` constant:

```dart
static const String baseUrl = 'http://YOUR_IP_ADDRESS:5000/api/users';
```

Replace `YOUR_IP_ADDRESS` with your computer's IP address on the local network.

### 2. Update CourseService

In `lib/services/course_service.dart`, update the `baseUrl` constant:

```dart
static const String baseUrl = 'http://YOUR_IP_ADDRESS:5000/api/courses';
```

### 3. Update ChatService

In `lib/services/chat_service.dart`, update the `baseUrl` constant:

```dart
static const String baseUrl = 'http://YOUR_IP_ADDRESS:5000/api/chats';
```

Also, add Socket.io client initialization for real-time chat:

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

// In the ChatService class
static late IO.Socket socket;

static Future<void> initSocket(String userId) async {
  socket = IO.io('http://YOUR_IP_ADDRESS:5000', <String, dynamic>{
    'transports': ['websocket'],
    'autoConnect': false,
  });
  
  socket.connect();
  socket.onConnect((_) {
    print('Connected to socket server');
  });
  
  socket.onDisconnect((_) {
    print('Disconnected from socket server');
  });
  
  socket.onError((error) {
    print('Socket error: $error');
  });
}
```

## API Integration

### Authentication

Update the login and register methods in `auth_service.dart` to use the new API:

```dart
static Future<User?> login(String email, String password) async {
  try {
    final response = await client.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'email': email,
        'password': password
      })
    );
    
    if (response.statusCode == 200) {
      final userData = json.decode(response.body);
      final user = User(
        id: userData['_id'],
        name: userData['name'],
        email: userData['email'],
        role: userData['role'],
        avatar: userData['avatar'],
      );
      await _saveUser(user);
      return user;
    } else {
      throw Exception('Invalid credentials');
    }
  } catch (e) {
    throw Exception('Error during login: $e');
  }
}
```

### Course Management

Update the course methods in `course_service.dart` to use the new API:

```dart
static Future<List<Course>> getCourses({int page = 1, int limit = 10}) async {
  try {
    final response = await http.get(
      Uri.parse('$baseUrl?page=$page&limit=$limit'),
      headers: await _getAuthHeaders(),
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final courses = data['courses'] as List;
      
      return courses.map((course) => Course.fromJson(course)).toList();
    } else {
      throw Exception('Failed to load courses: ${response.statusCode}');
    }
  } catch (e) {
    throw Exception('Failed to load courses: $e');
  }
}

// Helper method to get auth headers
static Future<Map<String, String>> _getAuthHeaders() async {
  final user = await AuthService.getCurrentUser();
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${user?.token}'
  };
}
```

### Chat Integration

Update the chat methods in `chat_service.dart` to use the new API and Socket.io:

```dart
static Future<List<ChatMessage>> getCourseMessages(String courseId) async {
  try {
    final response = await client.get(
      Uri.parse('$baseUrl/$courseId'),
      headers: await AuthService.getAuthHeaders(),
    );
    
    if (response.statusCode == 200) {
      final List<dynamic> messages = json.decode(response.body);
      return messages
          .map((json) => ChatMessage.fromJson(json))
          .toList()
          ..sort((a, b) => b.timestamp.compareTo(a.timestamp));
    } else {
      throw Exception('Failed to load messages');
    }
  } catch (e) {
    throw Exception('Error fetching messages: $e');
  }
}

static Future<void> sendMessage(ChatMessage message) async {
  try {
    // Send via REST API
    await client.post(
      Uri.parse(baseUrl),
      headers: await AuthService.getAuthHeaders(),
      body: json.encode(message.toJson())
    );
    
    // Also emit via Socket.io for real-time
    socket.emit('sendMessage', {
      'senderId': message.senderId,
      'courseId': message.courseId,
      'content': message.content
    });
  } catch (e) {
    throw Exception('Error sending message: $e');
  }
}

// Method to join a course chat room
static void joinCourseChat(String userId, String courseId) {
  socket.emit('joinCourse', {
    'userId': userId,
    'courseId': courseId
  });
}

// Method to listen for new messages
static void listenForMessages(Function(ChatMessage) onMessageReceived) {
  socket.on('newMessage', (data) {
    final message = ChatMessage.fromJson(data);
    onMessageReceived(message);
  });
}
```

## Required Flutter Dependencies

Add these dependencies to your `pubspec.yaml` file:

```yaml
dependencies:
  socket_io_client: ^2.0.0
  http: ^0.13.5
  shared_preferences: ^2.0.15
```

Run `flutter pub get` to install the dependencies.

## Testing the Integration

1. Start the backend server: `cd backend && npm start`
2. Run the Flutter app: `flutter run`
3. Test the login functionality with the credentials from the seed data:
   - Teacher: teacher@example.com / password123
   - Student: student@example.com / password123

## Troubleshooting

- If you encounter CORS issues, make sure the backend CORS configuration is correctly set up.
- For Socket.io connection issues, verify that your device and the server are on the same network.
- If authentication fails, check that the token is being properly stored and sent with requests.