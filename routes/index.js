
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'CA Expo 2012' });
};

exports.waiting_room = function(req, res) {
  res.render('waiting', { title: 'CA Expo 2012', username: req.param('username') });
};

exports.controller = function(req, res) {
  res.render('controller', { title: 'CA Expo 2012' });
};

exports.game = function(req, res) {
  res.render('game', { title: 'CA Expo 2012 :: Game', username: req.param('username') });
};
