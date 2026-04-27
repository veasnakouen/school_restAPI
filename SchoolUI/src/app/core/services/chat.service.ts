import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';

export interface ChatMessage {
  sender: string;
  receiver: string;
  message: string;
  timestamp: Date;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private hubConnection: signalR.HubConnection | null = null;
  
  public messages = signal<ChatMessage[]>([]);
  public onlineUsers = signal<string[]>([]);
  public unreadCount = signal<number>(0);
  public isChatOpen = false;
  public typingUsers = signal<string[]>([]);
  private typingTimeouts = new Map<string, any>();

  public startConnection() {
    if (this.hubConnection) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5001/hubs/chat', {
        accessTokenFactory: () => localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceivePrivateMessage', (sender: string, receiver: string, message: string, timestamp: string, attachmentUrl?: string, attachmentName?: string) => {
      this.messages.update(m => [...m, { sender, receiver, message, timestamp: new Date(timestamp), attachmentUrl, attachmentName }]);
      
      // Only notify and increment the badge if the message is from someone else
      if (sender !== this.getCurrentUser()) {
        this.playNotificationSound();

        if (!this.isChatOpen) {
          this.unreadCount.update(count => count + 1);
        }
      }
    });

    // Listen for history dumps from the database
    this.hubConnection.on('ReceiveHistory', (history: any[]) => {
      this.messages.update(existing => {
        const merged = [...existing];
        for (const msg of history) {
          // Simple deduplication to prevent showing duplicate messages if they are already in state
          const exists = merged.some(m => m.sender === msg.sender && m.receiver === msg.receiver && new Date(m.timestamp).getTime() === new Date(msg.timestamp).getTime());
          if (!exists) {
            merged.push({ sender: msg.sender, receiver: msg.receiver, message: msg.message, timestamp: new Date(msg.timestamp), attachmentUrl: msg.attachmentUrl, attachmentName: msg.attachmentName });
          }
        }
        return merged.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      });
    });

    // Listen for typing indicators
    this.hubConnection.on('UserTyping', (user: string) => {
      this.typingUsers.update(users => users.includes(user) ? users : [...users, user]);
      
      // Clear any existing timeout for this user
      if (this.typingTimeouts.has(user)) {
        clearTimeout(this.typingTimeouts.get(user));
      }

      // Set a new timeout to remove the typing indicator after 3 seconds of silence
      const timeout = setTimeout(() => {
        this.typingUsers.update(users => users.filter(u => u !== user));
        this.typingTimeouts.delete(user);
      }, 3000);
      this.typingTimeouts.set(user, timeout);
    });

    this.hubConnection.on('UserConnected', (user: string) => {
      this.onlineUsers.update(users => [...new Set([...users, user])]);
    });

    this.hubConnection.on('UserDisconnected', (user: string) => {
      this.onlineUsers.update(users => users.filter(u => u !== user));
    });

    this.hubConnection.on('UpdateOnlineUsers', (users: string[]) => {
      this.onlineUsers.set(users);
    });

    this.hubConnection.start().catch((err: any) => console.error('Error starting chat connection: ', err));
  }

  public stopConnection() {
    this.hubConnection?.stop();
    this.hubConnection = null;
  }

  public resetUnreadCount() {
    this.unreadCount.set(0);
  }

  public sendPrivateMessage(targetUser: string, message: string, attachmentUrl?: string, attachmentName?: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendPrivateMessage', targetUser, message, attachmentUrl || null, attachmentName || null).catch((err: any) => console.error(err));
    }
  }

  public sendTypingIndicator(targetUser: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('SendTypingIndicator', targetUser).catch((err: any) => console.error(err));
    }
  }

  public loadHistory(targetUser: string) {
    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('LoadHistory', targetUser).catch((err: any) => console.error(err));
    }
  }

  private getCurrentUser(): string {
    try {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        return userObj.userName || userObj.fullName || userObj.email || '';
      }
    } catch {}
    return '';
  }

  private playNotificationSound() {
    try {
      const audio = new Audio('assets/notification.mp3');
      audio.play().catch(() => {
        // Browsers block autoplaying audio if the user hasn't interacted with the page yet.
        // Catching the error prevents console spam.
      });
    } catch (err) {}
  }
}