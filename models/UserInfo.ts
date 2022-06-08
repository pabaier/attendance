export default class UserInfo {
  userName: string;
  userEmail: string;
  userId: number;
  roles: string[];

  constructor(userName? : string, userEmail? : string, userId? : number, roles? : string[]) {
    this.userName = userName || '';
    this.userEmail = userEmail || '';
    this.userId = userId || 0;
    this.roles = roles || [];
  }
}