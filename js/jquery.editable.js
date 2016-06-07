$(function () {
    $(".editable").each(function () {
        var label = $(this);
		label.css('cursor', 'pointer');
		label.after("<input type = 'text' class='fs-text-default-color' " + 
			"style = 'display:none; width: 100%; text-align: center;background-color: transparent;border: none;outline: none;font-size: 16px;' />");
		
		var textbox = $(this).next();
        textbox[0].name = this.id.replace("lbl", "txt");
 
        label.click(function () {
            $(this).hide();
            $(this).next().val($(this).html());
			$(this).next().show();
			$(this).next().focus();
        });
 
        textbox.focusout(function () {
            $(this).hide();
            $(this).prev().html($(this).val());
            $(this).prev().show();
			
			$(this).prev().trigger('editable-finish');
        });
    });
});