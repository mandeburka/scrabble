$(function () {
//models
    var Character = Backbone.Model.extend({
        defaults:{
            char: '',
            points: 0
        }
    });
    var CharacterCollection  = Backbone.Collection.extend({
        model: Character,
        url: '/chars',
        getPoints: function(c){
            var xs = chars.where({'char': c});
            if (xs.length > 0){
                return xs[0].get("points")
            } else {
                return 0;
            }
        }
    });

    var chars = new CharacterCollection;
    chars.fetch();

    var Word = Backbone.Model.extend({
        initialize: function (data) {
            this.set("raw_word", data.word);
            this.set("word", this.clearWord(data.word));
            this.set("points", this.computePoints(data.word));
        },
        clearWord: function(word){
            return word.replace(/\d/g, '');
        },
        computePoints: function (word) {
            var result = 0;
            //compute word multiplier
            var regexp_mult_word = /^\d+/;
            regexp_mult_word.compile(regexp_mult_word);
            var mult_word = word.match(regexp_mult_word);
            var multiplier = mult_word != null && mult_word.length > 0 ? parseInt(mult_word[0]) : 1;
            //remove it from word
            word = word.replace(regexp_mult_word, '');

            //compute points for chars with multipliers
            var regexp_mult_char = new RegExp("[а-я][0-9]", "g");
            regexp_mult_char.compile(regexp_mult_char);

            var mult_chars = word.match(regexp_mult_char);
            result += _.reduce(mult_chars, function(zero, match){
                return zero + chars.getPoints(match[0]) * parseInt(match[1]);
            }, 0);
            //remove all chars with multipliers from word
            word = word.replace(regexp_mult_char, '');

            //compute points for the rest chars
            result += _.reduce(word, function(zero, c){
                return chars.getPoints(c) + zero
            }, 0);
            //return multiplied points
            return result * multiplier;
        }
    });

    var Player = Backbone.Model.extend({
        defaults:{
            name: "",
            words: [],
            points: 0
        },
        initialize: function(){
            this.bind("change:words", this.calculatePoints, this);
        },
        calculatePoints: function(){
            this.set("points", _.reduce(this.get("words"), function(zero, item){
                return zero + item.get("points");
            }, 0));
        }
    });

    var PlayersCollections = Backbone.Collection.extend({
        model:Player,
        url: '/'
    });

    var Players = new PlayersCollections;

//views
    var PlayerView = Backbone.View.extend({
        tagName: "div",

        template: _.template($('#player-template').html()),

        events: {
            "submit .add-word"   : "addWord",
            "click .player-word .icon-remove": "removeWord",
            "click .remove-player": "removePlayer"
        },

        initialize: function(){
            this.model.bind('change change:words', this.render, this);
            this.model.bind('destroy', this.remove, this);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            this.$el.addClass('span-2');
            return this;
        },

        addWord: function(e){
            e.preventDefault();
            var wordInput = this.$(".add-word input");
            var word = wordInput.val();
            if (!word) return;
            wordInput.val('');
            var words = this.model.get("words");
            var wordObj = new Word({"word": word});
            words.push(wordObj);
            this.model.set("words", words);

            if (wordObj.get("points") == 0){
                //zero points word doesn't change model so hard render needed
                this.render();
            } else
                this.model.calculatePoints();
        },
        removeWord: function(e){
            var word_id = $(e.target).attr('id');
            var words = this.model.get("words");
            for (var i in words){
                var word = words[i];
                if (word.cid == word_id){
                    delete words[i];
                    this.model.set("words", words);
                    if (word.get("points") == 0)
                        this.render();
                    else
                        this.model.calculatePoints();
                    word.destroy();
                    break;
                }
            }
        },
        removePlayer: function(){
            this.model.destroy();
        }
    });

    var AppView = Backbone.View.extend({
        el:$("#scrabble-game"),
        events:{
            "submit #add-player":"addPlayer"
        },

        initialize: function(){
            this.playerName = this.$("#add-player input");
            Players.bind('add', this.addOne, this);
        },

        addOne: function(player){
            var view = new PlayerView({model: player});
            this.$("#scrabble-table").append(view.render().el);
        },

        addPlayer:function (e) {
            e.preventDefault();
            var name = this.playerName.val();
            if (!name) return;
            this.playerName.val("");
            Players.create({"name": name, "words": []});
        }
    });

    var App = new AppView;
});