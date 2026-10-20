// A proposed pack remains separate from the saved pack until the third approval.
export class SaveConfirmation {
 constructor(){this.cancel();}
 begin(value){this.proposal=JSON.parse(JSON.stringify(value));this.level=1;}
 advance(){if(!this.level)return null;if(this.level<3){this.level++;return null;}const value=this.proposal;this.cancel();return value;}
 cancel(){this.level=0;this.proposal=null;}
}
