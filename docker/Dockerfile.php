FROM php:8.4-apache

# Ativa módulos Apache necessários
RUN a2enmod rewrite headers

# Dependências de sistema para extensões PHP exigidas pelo OpenCATS
RUN apt-get update && apt-get install -y --no-install-recommends \
    antiword \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libpng-dev \
    libzip-dev \
    libxml2-dev \
    libonig-dev \
    libldap2-dev \
    poppler-utils \
    unrtf \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Extensões PHP exigidas pelo OpenCATS
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        mysqli \
        pdo_mysql \
        gd \
        soap \
        zip \
        ldap \
        mbstring \
        calendar

# Configuração PHP para desenvolvimento local
RUN echo "display_errors = On" >> /usr/local/etc/php/php.ini-development \
    && cp /usr/local/etc/php/php.ini-development /usr/local/etc/php/php.ini \
    && echo "upload_max_filesize = 20M" >> /usr/local/etc/php/php.ini \
    && echo "post_max_size = 22M" >> /usr/local/etc/php/php.ini \
    && echo "memory_limit = 256M" >> /usr/local/etc/php/php.ini

# VirtualHost: DocumentRoot aponta para o OpenCATS
RUN echo '<VirtualHost *:80>\n\
    DocumentRoot /var/www/html\n\
    <Directory /var/www/html>\n\
        AllowOverride All\n\
        Require all granted\n\
        Options -Indexes +FollowSymLinks\n\
    </Directory>\n\
    ErrorLog ${APACHE_LOG_DIR}/error.log\n\
    CustomLog ${APACHE_LOG_DIR}/access.log combined\n\
</VirtualHost>' > /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html
