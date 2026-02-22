import { AfterViewChecked, Component, ElementRef, inject, ViewChild } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chat-box',
  imports: [MatProgressSpinner, DatePipe, MatIconModule],
  templateUrl: './chat-box.html',
  styles: [`
    .chat-icon {
      width: 40px;
      height: 40px;
      font-size: 48px;
    }
  `],
})
export class ChatBox implements AfterViewChecked {

  @ViewChild('chatBox', { read: ElementRef }) public chatBox?: ElementRef;

  authService = inject(AuthService);
  chatService = inject(ChatService);
  private pageNumber = 2;

  loadMoreMessages() {
    this.pageNumber++;
    this.chatService.loadMessages(this.pageNumber);
    this.scrollTop();
  }

  ngAfterViewChecked(): void {
    if (this.chatService.autoScrollEnabled()) {
      this.scrollTobottom();
    }
  }

  scrollTobottom() {
    this.chatService.autoScrollEnabled.set(true);
    this.chatBox?.nativeElement.scrollTo({
      top: this.chatBox!.nativeElement.scrollHeight,
      behavior: 'smooth'
    });
  }

  scrollTop() {
  this.chatService.autoScrollEnabled.set(false);
  setTimeout(() => {
    this.chatBox?.nativeElement.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, 100);
}
}