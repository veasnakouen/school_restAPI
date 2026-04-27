import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating Container -->
    <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        
      <!-- Chat Window -->
      @if (isOpen) {
        <div class="w-80 sm:w-96 h-[500px] border border-base-300 rounded-2xl overflow-hidden bg-base-100 shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right">
          
          @if (!selectedUser) {
            <!-- Step 1: User List -->
            <div class="p-3 border-b border-base-300 bg-primary text-primary-content flex justify-between items-center shadow-sm">
              <div class="flex items-center gap-2">
                <span class="font-bold text-lg">Online Users</span>
                <div class="badge badge-success badge-xs"></div>
                <span class="text-xs opacity-80">{{ chatService.onlineUsers().length }} online</span>
              </div>
              <button class="btn btn-ghost btn-xs btn-circle text-primary-content hover:bg-primary-focus" (click)="toggleChat()">✕</button>
            </div>

            <div class="flex-1 overflow-y-auto bg-base-200/30 p-2">
              <ul class="space-y-1">
                @for (user of chatService.onlineUsers(); track user) {
                  @if (user !== currentUser) {
                    <li (click)="selectUser(user)" class="flex items-center gap-3 p-3 bg-base-100 border border-base-200 rounded-xl hover:border-primary hover:shadow-sm cursor-pointer transition-all">
                      <div class="avatar placeholder">
                        <div class="bg-neutral text-neutral-content rounded-full w-10">
                          <span class="text-lg uppercase">{{ user.charAt(0) }}</span>
                        </div>
                      </div>
                      <span class="font-medium flex-1 truncate">{{ user }}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-base-content/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                    </li>
                  }
                }
                @if (chatService.onlineUsers().length <= 1) {
                  <div class="flex flex-col items-center justify-center h-full text-base-content/40 p-6 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    <p class="text-sm">No one else is online right now.</p>
                  </div>
                }
              </ul>
            </div>
          } @else {
            <!-- Step 2: 1-on-1 Chat -->
            <div class="p-3 border-b border-base-300 bg-primary text-primary-content flex justify-between items-center shadow-sm">
              <div class="flex items-center gap-2">
                <button class="btn btn-ghost btn-xs btn-circle text-primary-content hover:bg-primary-focus mr-1" (click)="selectedUser = null">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div class="avatar placeholder">
                  <div class="bg-primary-content text-primary rounded-full w-6">
                    <span class="text-xs uppercase">{{ selectedUser.charAt(0) }}</span>
                  </div>
                </div>
                <span class="font-bold text-md truncate max-w-[150px]">{{ selectedUser }}</span>
              </div>
              <button class="btn btn-ghost btn-xs btn-circle text-primary-content hover:bg-primary-focus" (click)="toggleChat()">✕</button>
            </div>

            <div #chatScroll class="flex-1 p-4 overflow-y-auto flex flex-col gap-2 bg-base-200/30">
              @for (msg of getMessagesForUser(selectedUser); track msg.timestamp) {
                <div class="chat" [class.chat-end]="msg.sender === currentUser" [class.chat-start]="msg.sender !== currentUser">
                  <div class="chat-header opacity-60 text-xs mb-1">
                    {{ msg.sender === currentUser ? 'You' : msg.sender }}
                    <time class="ml-1">{{ msg.timestamp | date:'shortTime' }}</time>
                  </div>
                  <div class="chat-bubble text-sm shadow-sm flex flex-col" [class.chat-bubble-primary]="msg.sender === currentUser">
                    @if (msg.attachmentUrl) {
                      @if (isImage(msg.attachmentUrl)) {
                        <a [href]="'http://localhost:5001' + msg.attachmentUrl" target="_blank">
                          <img [src]="'http://localhost:5001' + msg.attachmentUrl" alt="Attachment" class="max-w-[200px] rounded-lg mb-1 object-cover cursor-pointer hover:opacity-90 bg-base-100" />
                        </a>
                      } @else {
                        <a [href]="'http://localhost:5001' + msg.attachmentUrl" target="_blank" class="flex items-center gap-1 underline mb-1 font-medium hover:opacity-80" [class.text-primary-content]="msg.sender === currentUser">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                          {{ msg.attachmentName || 'Attachment' }}
                        </a>
                      }
                    }
                    @if (msg.message) {
                      <span>{{ msg.message }}</span>
                    }
                  </div>
                </div>
              } @empty {
                <div class="flex-1 flex flex-col items-center justify-center text-base-content/40 h-full">
                  <p class="text-sm">Say hi to {{ selectedUser }}!</p>
                </div>
              }
              
              <!-- Typing Indicator -->
              @if (chatService.typingUsers().includes(selectedUser)) {
                <div class="chat chat-start">
                  <div class="chat-header opacity-60 text-xs mb-1">{{ selectedUser }}</div>
                  <div class="chat-bubble text-sm shadow-sm bg-base-200/50 text-base-content/70 flex items-center h-10">
                    <span class="loading loading-dots loading-xs"></span>
                  </div>
                </div>
              }
            </div>

            <!-- Input Area -->
            <div class="p-3 border-t border-base-300 bg-base-100">
              <form (submit)="sendMessage(); $event.preventDefault()" class="flex gap-2 items-center">
                <input type="file" #fileInput class="hidden" (change)="onFileSelected($event)" accept="image/*,.pdf,.doc,.docx,.txt" />
                <button type="button" class="btn btn-sm btn-ghost btn-square text-base-content/70" (click)="fileInput.click()" [disabled]="isUploading" title="Attach file">
                  @if (isUploading) {
                    <span class="loading loading-spinner loading-xs"></span>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  }
                </button>
                <input 
                  type="text" 
                  [(ngModel)]="newMessage" 
                  name="message"
                  (input)="onTyping()"
                  placeholder="Type a message..." 
                  class="input input-sm input-bordered flex-1" 
                  autocomplete="off"
                />
                <button type="submit" class="btn btn-sm btn-primary btn-square" [disabled]="!newMessage.trim() && !isUploading">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </div>
          }
        </div>
      }

      <!-- Floating Toggle Button -->
      <button 
        class="btn btn-circle btn-primary btn-lg shadow-2xl border-2 border-base-100" 
        (click)="toggleChat()"
        [class.animate-bounce]="chatService.unreadCount() > 0 && !isOpen"
      >
        <div class="indicator">
          @if (chatService.unreadCount() > 0 && !isOpen) {
            <span class="indicator-item badge badge-secondary badge-sm border-base-100">{{ chatService.unreadCount() }}</span>
          }
          @if (isOpen) {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          }
        </div>
      </button>
    </div>
  `
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  public chatService = inject(ChatService);
  private http = inject(HttpClient);
  public newMessage = '';
  public currentUser = '';
  public isOpen = false;
  public selectedUser: string | null = null;
  private lastTypingTime = 0;
  public isUploading = false;

  @ViewChild('chatScroll') private chatScrollContainer!: ElementRef;

  toggleChat() {
    this.isOpen = !this.isOpen;
    this.chatService.isChatOpen = this.isOpen;
    if (this.isOpen) {
      this.chatService.resetUnreadCount();
    }
  }

  ngOnInit() {
    this.chatService.startConnection();
    
    try {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        // Try to capture the name matching what the backend Hub extracts from the JWT Claims
        this.currentUser = userObj.userName || userObj.fullName || userObj.email || '';
      }
    } catch {}
  }

  ngOnDestroy() {
    // Mark chat as closed but DO NOT stop the connection so it listens in the background
    this.chatService.isChatOpen = false;
  }

  selectUser(user: string) {
    this.selectedUser = user;
    // Request the message history for this specific user
    this.chatService.loadHistory(user);
    setTimeout(() => this.scrollToBottom(), 50);
  }

  getMessagesForUser(user: string) {
    return this.chatService.messages().filter(m => 
      (m.sender === this.currentUser && m.receiver === user) ||
      (m.sender === user && m.receiver === this.currentUser)
    );
  }

  onTyping() {
    if (!this.selectedUser) return;
    const now = Date.now();
    // Only send the typing event to the backend max once every 2 seconds
    if (now - this.lastTypingTime > 2000) {
      this.chatService.sendTypingIndicator(this.selectedUser);
      this.lastTypingTime = now;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0 && this.selectedUser) {
      const file = input.files[0];
      this.isUploading = true;
      const formData = new FormData();
      formData.append('file', file);
      
      this.http.post<{url: string, name: string}>('http://localhost:5001/api/chat/upload', formData).subscribe({
        next: (res) => {
          this.chatService.sendPrivateMessage(this.selectedUser!, this.newMessage.trim(), res.url, res.name || file.name);
          this.newMessage = '';
          this.isUploading = false;
          input.value = '';
          setTimeout(() => this.scrollToBottom(), 50);
        },
        error: (err) => {
          console.error('Upload failed', err);
          this.isUploading = false;
          input.value = '';
        }
      });
    }
  }

  sendMessage() {
    if (this.newMessage.trim() && this.selectedUser && !this.isUploading) {
      this.chatService.sendPrivateMessage(this.selectedUser, this.newMessage.trim());
      this.newMessage = '';
      setTimeout(() => this.scrollToBottom(), 50);
    }
  }

  isImage(url: string | null | undefined): boolean {
    if (!url) return false;
    const lower = url.toLowerCase();
    return lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.gif') || lower.endsWith('.webp');
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      if (this.chatScrollContainer) {
        this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }
}