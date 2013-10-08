(function($) {

    processUserName();

    var game = new BattleShip.Game($('#human_field'), $('#bot_field'), $('#game_status'), 10, 10);
    game.start();

    function processUserName() {
        $('#game_container').hide();

        $('#username_box_tb').focus();

        $('#username_box_btn').click(function() {
            onUserNameEntered()
        });

        $('#username_box_tb').keydown( function(event) {
            if (event.keyCode == 13) {   // 13 = Enter
                onUserNameEntered();
                event.preventDefault();
            }
        })

        function onUserNameEntered() {
            var userName = $('#username_box_tb').val();

            var userNameRegExp = /^[A-Za-zА-ЯЁа-яё ]+$/ //Только буквы
            if (!userNameRegExp.test(userName)) {
                alert("Имя пользователя не может быть пустым и должно состоять только из букв!");
                $('#username_box_tb').val('');
                return;
            }
            $('#user_info').append(userName);

            $('#input_username_box').hide(500);
            $('#game_container').show(500);
        }
    }
})(jQuery);