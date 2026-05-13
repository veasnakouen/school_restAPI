import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';

export interface ChatMessage {
  sender: string;
  receiver: string;
  message: string;
  timestamp: Date;
  attachmentUrl?: string;
  attachmentName?: string;
  isRead?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private hubConnection: signalR.HubConnection | null = null;

  // Angular Signals for the UI component to bind to
  public onlineUsers = signal<string[]>([]);
  public messages = signal<ChatMessage[]>([]);
  public typingUsers = signal<string[]>([]);
  public unreadCount = signal<number>(0);
  public isChatOpen = false;
  public activeChatUser = signal<string | null>(null);
  private typingTimers = new Map<string, any>();

  public startConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5001/hubs/chat', {
        accessTokenFactory: () => localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || ''
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('ChatHub connection successfully started'))
      .catch(err => console.error('Error while starting ChatHub connection: ', err));

    this.registerListeners();
  }

  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }

  private registerListeners(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('UpdateOnlineUsers', (users: string[]) => this.onlineUsers.set(users));

    this.hubConnection.on('UserConnected', (userName: string) => {
      this.onlineUsers.update(users => users.includes(userName) ? users : [...users, userName]);
    });

    this.hubConnection.on('UserDisconnected', (userName: string) => {
      this.onlineUsers.update(users => users.filter(u => u !== userName));
    });

    this.hubConnection.on('ReceivePrivateMessage', (sender: string, receiver: string, message: string, timestamp: string, attachmentUrl?: string, attachmentName?: string) => {
      const isCurrentlyViewing = this.isChatOpen && this.activeChatUser() === sender;
      const newMsg: ChatMessage = { sender, receiver, message, timestamp: new Date(timestamp), attachmentUrl, attachmentName, isRead: isCurrentlyViewing };
      this.messages.update(msgs => [...msgs, newMsg]);

      // Increment the unread badge if the chat window is closed!
      if (!this.isChatOpen) {
        this.unreadCount.update(count => count + 1);
      } else if (isCurrentlyViewing) {
        // Automatically fire read receipt back if we are actively viewing this chat
        this.hubConnection?.invoke('MarkAsRead', sender).catch(err => console.error(err));
      }
    });

    this.hubConnection.on('MessagesSeen', (receiverName: string) => {
      // The receiver has read our messages, update the local UI to turn the checkmarks blue
      this.messages.update(msgs => msgs.map(msg => (msg.receiver === receiverName) ? { ...msg, isRead: true } : msg));
    });

    this.hubConnection.on('ReceiveHistory', (history: ChatMessage[]) => {
      const parsedHistory = history.map(msg => ({ ...msg, timestamp: new Date(msg.timestamp) }));
      this.messages.set(parsedHistory);
    });

    this.hubConnection.on('UserTyping', (userName: string) => {
      this.typingUsers.update(users => users.includes(userName) ? users : [...users, userName]);
      
      // Automatically clear the "Typing..." indicator after 3 seconds of silence
      if (this.typingTimers.has(userName)) {
        clearTimeout(this.typingTimers.get(userName));
      }
      this.typingTimers.set(userName, setTimeout(() => {
        this.typingUsers.update(users => users.filter(u => u !== userName));
        this.typingTimers.delete(userName);
      }, 3000));
    });
  }

  public resetUnreadCount(): void {
    this.unreadCount.set(0);
  }

  public markAsRead(targetUserName: string): Promise<void> {
    let changed = false;
    this.messages.update(msgs => msgs.map(msg => {
      if (msg.sender === targetUserName && !msg.isRead) {
        changed = true;
        return { ...msg, isRead: true };
      }
      return msg;
    }));
    
    if (changed && this.hubConnection) {
      return this.hubConnection.invoke('MarkAsRead', targetUserName).catch(err => console.error(err)) || Promise.resolve();
    }
    return Promise.resolve();
  }

  // Invokable server methods
  public sendMessage(targetUserName: string, message: string, attachmentUrl?: string, attachmentName?: string): Promise<void> {
    return this.hubConnection?.invoke('SendPrivateMessage', targetUserName, message, attachmentUrl, attachmentName) || Promise.reject('Connection not established');
  }
  public sendTypingIndicator(targetUserName: string): Promise<void> {
    return this.hubConnection?.invoke('SendTypingIndicator', targetUserName) || Promise.reject('Connection not established');
  }
  public loadHistory(targetUserName: string): Promise<void> {
    return this.hubConnection?.invoke('LoadHistory', targetUserName) || Promise.reject('Connection not established');
  }
}