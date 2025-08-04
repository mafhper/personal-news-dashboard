sudo apt update
sudo apt install apache2
==
sudo rm -rf /var/www/html/*
==
sudo cp -r dist/* /var/www/html/
==
sudo chown -R www-data:www-data /var/www/html
sudo chmod -R 755 /var/www/html
==
sudo systemctl restart apache2
==
sudo lsof -i :80
==
sudo systemctl stop nginx
