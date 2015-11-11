ProteinData = new Meteor.Collection('protein_data');
History = new Meteor.Collection('history');

ProteinData.allow({
  insert: function(userId, data){
    if(data.userId == userId)
      return true;
    return false;
  }
});

Meteor.methods({
  addProtein: function(amount){

    // this.isSimulation returns true for client
    // if(!this.isSimulation)
    // {
    //   var Future = Npm.require('fibers/future');
    //   var future = new Future();
    //   Meteor.setTimeout(function(){
    //     future.return();
    //   }, 1 * 1000);
    //   future.wait();
    // }
    // else
    // {
    //   amount = 500;
    // }
    ProteinData.update({userId: this.userId}, {$inc: {total:amount}});
    History.insert({
      value: amount,
      date: new Date(),
      userId: this.userId
    });
  },
  subProtein: function(amount){
    var protein = ProteinData.findOne({userId: this.userId}).total;
    console.log(protein)
    if(protein - amount >= 0)
    {
      ProteinData.update({userId: this.userId}, {$inc: {total:amount * -1}});
      History.insert({
        value: amount * -1,
        date: new Date(),
        userId: this.userId
      });
    }
    else
    {
      console.log("Update Restricted")
    }
  }
})

if (Meteor.isClient) {

  Meteor.subscribe('allProteinData');
  Meteor.subscribe('allHistory');

  // Dependancy: Run certain section of code based on changes to an element
  Deps.autorun(function(){
    if (Meteor.user()) //Meteor.user is the element in this case
      console.log("User Logged In: " + Meteor.user().profile.name);
    else
      console.log("User Logged out");
  });
    
  Template.userDetails.helpers({
    user: function(){
      var data = ProteinData.findOne();
      if(!data){
        data = {
          userId: Meteor.userId(),
          total: 0,
          goal: 200
        };
        ProteinData.insert(data);
      }
      return data;
    },
    lastAmount: function(){
      return Session.get('lastAmount');
    }
  });

  Template.userDetails.events({
    'click #addAmount' : function(event){
      event.preventDefault();
      var amount = parseInt($('#amount').val());
      Meteor.call('addProtein', amount, function (error, result) {
        if(error)
          return alert(error.reason);
      });
      Session.set('lastAmount', amount);
    },
    'click #quickSubtract' : function(event){
      event.preventDefault();
      var amount = parseInt($('#amount').val());
      Meteor.call('subProtein', amount, function (error, result) {
        if(error)
          return alert(error.reason);
      });
    }
  });

  Template.history.helpers({
    historyItem: function(){
      return History.find({}, {sort:{date: -1}});
    }
  });

}

if (Meteor.isServer) {

  ProteinData._ensureIndex({userId: 1}, {unique: true})

  Meteor.publish('allProteinData', function(){
    return ProteinData.find({userId: this.userId});
  });

  Meteor.publish('allHistory', function(){
    return History.find({userId: this.userId},{sort:{date: -1}, limit: 5});
  });

  Meteor.startup(function () {

  });
}
